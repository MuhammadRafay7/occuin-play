'use client';

import type { MediaType } from '@/lib/types';

export interface WatchlistItem {
  mediaType: MediaType;
  tmdbId: string;
  title: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  liked: boolean;
  addedAt: number;
}

const STORAGE_KEY = 'occuin_play_watchlist';
export const WATCHLIST_EVENT = 'occuin-play-watchlist-update';

function read(): WatchlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as WatchlistItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: WatchlistItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(WATCHLIST_EVENT));
  } catch {
    // storage unavailable
  }
}

function keyOf(mediaType: MediaType, tmdbId: string): string {
  return `${mediaType}:${tmdbId}`;
}

export function listWatchlist(): WatchlistItem[] {
  return read().sort((a, b) => b.addedAt - a.addedAt);
}

export function findWatchlistItem(mediaType: MediaType, tmdbId: string): WatchlistItem | null {
  return read().find((i) => keyOf(i.mediaType, i.tmdbId) === keyOf(mediaType, tmdbId)) ?? null;
}

export function toggleWatchlist(item: Omit<WatchlistItem, 'liked' | 'addedAt'>): boolean {
  const items = read();
  const key = keyOf(item.mediaType, item.tmdbId);
  const existing = items.find((i) => keyOf(i.mediaType, i.tmdbId) === key);

  if (existing) {
    write(items.filter((i) => keyOf(i.mediaType, i.tmdbId) !== key));
    return false;
  }

  write([...items, { ...item, liked: false, addedAt: Date.now() }]);
  return true;
}

export function toggleLike(item: Omit<WatchlistItem, 'liked' | 'addedAt'>): boolean {
  const items = read();
  const key = keyOf(item.mediaType, item.tmdbId);
  const existing = items.find((i) => keyOf(i.mediaType, i.tmdbId) === key);

  if (existing) {
    const liked = !existing.liked;
    write(items.map((i) => (keyOf(i.mediaType, i.tmdbId) === key ? { ...i, liked } : i)));
    return liked;
  }

  write([...items, { ...item, liked: true, addedAt: Date.now() }]);
  return true;
}

export function removeFromWatchlist(mediaType: MediaType, tmdbId: string): void {
  write(read().filter((i) => keyOf(i.mediaType, i.tmdbId) !== keyOf(mediaType, tmdbId)));
}
