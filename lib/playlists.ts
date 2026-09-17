'use client';

import type { MediaType } from '@/lib/types';

export interface PlaylistItem {
  mediaType: MediaType;
  tmdbId: string;
  title: string;
  posterPath?: string | null;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  items: PlaylistItem[];
  updatedAt: number;
}

const STORAGE_KEY = 'occuin_play_playlists';
export const PLAYLISTS_EVENT = 'occuin-play-playlists-update';

function read(): Playlist[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Playlist[]) : [];
  } catch {
    return [];
  }
}

function write(playlists: Playlist[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
    window.dispatchEvent(new Event(PLAYLISTS_EVENT));
  } catch {
    // ignore
  }
}

export function listPlaylists(): Playlist[] {
  return read().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function createPlaylist(name: string, description?: string): Playlist {
  const playlist: Playlist = {
    id: Math.random().toString(36).slice(2, 10),
    name,
    description,
    items: [],
    updatedAt: Date.now(),
  };
  write([...read(), playlist]);
  return playlist;
}

export function deletePlaylist(id: string): void {
  write(read().filter((p) => p.id !== id));
}

export function addToPlaylist(id: string, item: PlaylistItem): void {
  write(
    read().map((playlist) => {
      if (playlist.id !== id) return playlist;
      const exists = playlist.items.some(
        (i) => i.tmdbId === item.tmdbId && i.mediaType === item.mediaType
      );
      if (exists) return playlist;
      return { ...playlist, items: [...playlist.items, item], updatedAt: Date.now() };
    })
  );
}

export function removeFromPlaylist(id: string, tmdbId: string, mediaType: MediaType): void {
  write(
    read().map((playlist) =>
      playlist.id === id
        ? {
            ...playlist,
            items: playlist.items.filter(
              (i) => !(i.tmdbId === tmdbId && i.mediaType === mediaType)
            ),
            updatedAt: Date.now(),
          }
        : playlist
    )
  );
}

export function encodePlaylist(playlist: Playlist): string {
  const compact = {
    n: playlist.name,
    d: playlist.description,
    i: playlist.items.map((item) => [item.mediaType === 'tv' ? 1 : 0, item.tmdbId, item.title]),
  };
  return btoa(encodeURIComponent(JSON.stringify(compact)));
}

export function decodePlaylist(encoded: string): Playlist | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(atob(encoded))) as {
      n: string;
      d?: string;
      i: [number, string, string][];
    };
    return {
      id: Math.random().toString(36).slice(2, 10),
      name: parsed.n,
      description: parsed.d,
      items: parsed.i.map(([type, tmdbId, title]) => ({
        mediaType: type === 1 ? 'tv' : 'movie',
        tmdbId,
        title,
      })),
      updatedAt: Date.now(),
    };
  } catch {
    return null;
  }
}

export function importPlaylist(playlist: Playlist): void {
  write([...read(), playlist]);
}
