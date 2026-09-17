'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase';
import type { MediaType } from '@/lib/types';
import {
  getWatchProgress,
  isCompleted,
  listContinueWatching,
  percentWatched,
  saveWatchProgress,
  WATCH_HISTORY_EVENT,
  type WatchProgress,
} from '@/lib/watchHistory';

function useHistorySubscription(onChange: () => void) {
  useEffect(() => {
    onChange();
    window.addEventListener(WATCH_HISTORY_EVENT, onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener(WATCH_HISTORY_EVENT, onChange);
      window.removeEventListener('storage', onChange);
    };
  }, [onChange]);
}

export function useEpisodeProgress(
  mediaType: MediaType,
  tmdbId: string | number,
  season = 0,
  episode = 0
): { percent: number; completed: boolean } {
  const [state, setState] = useState({ percent: 0, completed: false });

  const update = useCallback(() => {
    const progress = getWatchProgress(mediaType, tmdbId, season, episode);
    const percent = percentWatched(progress);
    setState({ percent: percent > 2 ? percent : 0, completed: isCompleted(progress) });
  }, [mediaType, tmdbId, season, episode]);

  useHistorySubscription(update);

  return state;
}

export function useContinueWatching(limit = 20): WatchProgress[] {
  const [entries, setEntries] = useState<WatchProgress[]>([]);

  const update = useCallback(() => {
    setEntries(listContinueWatching(limit));
  }, [limit]);

  useHistorySubscription(update);

  return entries;
}

export function useWatchProgress() {
  const supabase = useMemo(() => createClient(), []);

  const record = useCallback(
    async (entry: Omit<WatchProgress, 'updatedAt'>) => {
      saveWatchProgress(entry);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('watch_history').upsert(
          {
            user_id: user.id,
            tmdb_id: Number(entry.tmdbId),
            media_type: entry.mediaType,
            season_num: entry.mediaType === 'tv' ? entry.season : 1,
            episode_num: entry.mediaType === 'tv' ? entry.episode : 1,
            watched_sec: entry.currentTime,
            total_sec: entry.duration,
            completed: isCompleted({ ...entry, updatedAt: Date.now() }),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,tmdb_id,media_type,season_num,episode_num' }
        );
      } catch {
        // Remote sync is best-effort; local progress already persisted.
      }
    },
    [supabase]
  );

  return { record };
}
