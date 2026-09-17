'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  findWatchlistItem,
  listWatchlist,
  toggleLike,
  toggleWatchlist,
  WATCHLIST_EVENT,
  type WatchlistItem,
} from '@/lib/watchlist';
import type { MediaType } from '@/lib/types';

function useWatchlistSubscription(onChange: () => void) {
  useEffect(() => {
    onChange();
    window.addEventListener(WATCHLIST_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(WATCHLIST_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, [onChange]);
}

export function useWatchlist(): WatchlistItem[] {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const update = useCallback(() => setItems(listWatchlist()), []);
  useWatchlistSubscription(update);
  return items;
}

export function useWatchlistEntry(mediaType: MediaType, tmdbId: string) {
  const [state, setState] = useState({ saved: false, liked: false });

  const update = useCallback(() => {
    const entry = findWatchlistItem(mediaType, tmdbId);
    setState({ saved: Boolean(entry), liked: Boolean(entry?.liked) });
  }, [mediaType, tmdbId]);

  useWatchlistSubscription(update);

  return {
    ...state,
    toggleSaved: (item: { title: string; posterPath?: string | null; backdropPath?: string | null }) =>
      toggleWatchlist({ mediaType, tmdbId, ...item }),
    toggleLiked: (item: { title: string; posterPath?: string | null; backdropPath?: string | null }) =>
      toggleLike({ mediaType, tmdbId, ...item }),
  };
}
