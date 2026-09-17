import type { MediaType } from '@/lib/types';

const PREFIX = 'watch_history';
export const WATCH_HISTORY_EVENT = 'watch-history-update';
const COMPLETION_THRESHOLD = 0.9;

export interface WatchProgress {
  mediaType: MediaType;
  tmdbId: string;
  season: number;
  episode: number;
  currentTime: number;
  duration: number;
  updatedAt: number;
  title?: string;
  posterPath?: string | null;
}

export function progressKey(
  mediaType: MediaType,
  tmdbId: string | number,
  season: number,
  episode: number
): string {
  return mediaType === 'tv'
    ? `${PREFIX}_tv_${tmdbId}_s${season}_e${episode}`
    : `${PREFIX}_movie_${tmdbId}`;
}

function safeLocalStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function getWatchProgress(
  mediaType: MediaType,
  tmdbId: string | number,
  season = 0,
  episode = 0
): WatchProgress | null {
  const storage = safeLocalStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(progressKey(mediaType, tmdbId, season, episode));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WatchProgress;
    if (typeof parsed?.currentTime !== 'number' || typeof parsed?.duration !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveWatchProgress(
  entry: Omit<WatchProgress, 'updatedAt'>
): void {
  const storage = safeLocalStorage();
  if (!storage || !entry.duration || !Number.isFinite(entry.duration)) return;

  const payload: WatchProgress = { ...entry, updatedAt: Date.now() };
  try {
    storage.setItem(
      progressKey(entry.mediaType, entry.tmdbId, entry.season, entry.episode),
      JSON.stringify(payload)
    );
    window.dispatchEvent(new Event(WATCH_HISTORY_EVENT));
  } catch {
    // Quota exceeded or storage blocked; progress is best-effort.
  }
}

export function clearWatchProgress(
  mediaType: MediaType,
  tmdbId: string | number,
  season = 0,
  episode = 0
): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  try {
    storage.removeItem(progressKey(mediaType, tmdbId, season, episode));
    window.dispatchEvent(new Event(WATCH_HISTORY_EVENT));
  } catch {
    // ignore
  }
}

export function percentWatched(progress: WatchProgress | null): number {
  if (!progress || !progress.duration || progress.duration <= 0) return 0;
  return Math.min(Math.round((progress.currentTime / progress.duration) * 100), 100);
}

export function isCompleted(progress: WatchProgress | null): boolean {
  if (!progress || !progress.duration) return false;
  return progress.currentTime / progress.duration >= COMPLETION_THRESHOLD;
}

export function listContinueWatching(limit = 20): WatchProgress[] {
  const storage = safeLocalStorage();
  if (!storage) return [];

  const entries: WatchProgress[] = [];
  try {
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (!key?.startsWith(`${PREFIX}_`)) continue;
      const raw = storage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as WatchProgress;
        if (!parsed?.tmdbId || isCompleted(parsed)) continue;
        if (percentWatched(parsed) < 2) continue;
        entries.push(parsed);
      } catch {
        continue;
      }
    }
  } catch {
    return [];
  }

  return entries.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit);
}

export function readAllProgress(): WatchProgress[] {
  const storage = safeLocalStorage();
  if (!storage) return [];

  const entries: WatchProgress[] = [];
  try {
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (!key?.startsWith(`${PREFIX}_`)) continue;
      const raw = storage.getItem(key);
      if (!raw) continue;
      try {
        const parsed = JSON.parse(raw) as WatchProgress;
        if (parsed?.tmdbId) entries.push(parsed);
      } catch {
        continue;
      }
    }
  } catch {
    return [];
  }
  return entries;
}

function writeEntry(entry: WatchProgress): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(
      progressKey(entry.mediaType, entry.tmdbId, entry.season, entry.episode),
      JSON.stringify(entry)
    );
  } catch {
    // ignore
  }
}

function notify(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(WATCH_HISTORY_EVENT));
}

export interface WatchStateTarget {
  mediaType: MediaType;
  tmdbId: string;
  season: number;
  episode: number;
  runtimeSeconds?: number;
  title?: string;
  posterPath?: string | null;
}

export function setWatchedState(targets: WatchStateTarget[], watched: boolean): number {
  const storage = safeLocalStorage();
  if (!storage) return 0;

  let changed = 0;
  for (const target of targets) {
    const key = progressKey(target.mediaType, target.tmdbId, target.season, target.episode);
    if (!watched) {
      try {
        storage.removeItem(key);
        changed += 1;
      } catch {
        continue;
      }
      continue;
    }

    const duration = (target.runtimeSeconds && target.runtimeSeconds > 0
      ? target.runtimeSeconds
      : 45 * 60);
    writeEntry({
      mediaType: target.mediaType,
      tmdbId: target.tmdbId,
      season: target.season,
      episode: target.episode,
      currentTime: duration,
      duration,
      updatedAt: Date.now(),
      title: target.title,
      posterPath: target.posterPath,
    });
    changed += 1;
  }

  notify();
  return changed;
}

export function clearAllProgress(): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const key = storage.key(i);
      if (key?.startsWith(`${PREFIX}_`)) keys.push(key);
    }
    keys.forEach((key) => storage.removeItem(key));
    notify();
  } catch {
    // ignore
  }
}

export interface HistoryExport {
  version: 1;
  exportedAt: string;
  entries: WatchProgress[];
}

export function exportHistory(): HistoryExport {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    entries: readAllProgress(),
  };
}

export function mergeEntries(
  local: WatchProgress[],
  incoming: WatchProgress[]
): { merged: WatchProgress[]; applied: number } {
  const byKey = new Map<string, WatchProgress>();
  for (const entry of local) {
    byKey.set(progressKey(entry.mediaType, entry.tmdbId, entry.season, entry.episode), entry);
  }

  let applied = 0;
  for (const entry of incoming) {
    if (!entry?.tmdbId || typeof entry.updatedAt !== 'number') continue;
    const key = progressKey(entry.mediaType, entry.tmdbId, entry.season, entry.episode);
    const existing = byKey.get(key);
    if (!existing || entry.updatedAt > existing.updatedAt) {
      byKey.set(key, entry);
      applied += 1;
    }
  }

  return { merged: [...byKey.values()], applied };
}

export function importHistory(payload: unknown): { applied: number; skipped: number } {
  const entries = Array.isArray(payload)
    ? (payload as WatchProgress[])
    : ((payload as HistoryExport)?.entries ?? []);

  if (!Array.isArray(entries)) return { applied: 0, skipped: 0 };

  const valid = entries.filter(
    (e) =>
      e &&
      typeof e.tmdbId === 'string' &&
      typeof e.currentTime === 'number' &&
      typeof e.duration === 'number' &&
      typeof e.updatedAt === 'number'
  );

  const { merged, applied } = mergeEntries(readAllProgress(), valid);
  merged.forEach(writeEntry);
  notify();

  return { applied, skipped: entries.length - valid.length };
}
