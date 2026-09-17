'use client';

import { useCallback, useEffect, useState } from 'react';
import { MessageSquare, Send, Smile } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase';
import type { MediaType } from '@/lib/types';

export interface TimelineComment {
  id: string;
  tmdb_id: number;
  media_type: MediaType;
  season_num: number;
  episode_num: number;
  timestamp_sec: number;
  body: string;
  author: string;
  created_at: string;
}

interface TimelineCommentsProps {
  mediaType: MediaType;
  tmdbId: string;
  season: number;
  episode: number;
  currentTime: number;
  onSeek?: (time: number) => void;
  onCommentsLoaded?: (comments: TimelineComment[]) => void;
}

const REACTIONS = ['😂', '😮', '😍', '🔥', '😭', '👏'];

function formatTime(seconds: number): string {
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

export default function TimelineComments({
  mediaType,
  tmdbId,
  season,
  episode,
  currentTime,
  onSeek,
  onCommentsLoaded,
}: TimelineCommentsProps) {
  const [comments, setComments] = useState<TimelineComment[]>([]);
  const [body, setBody] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'unavailable'>('loading');
  const [bursts, setBursts] = useState<{ id: number; emoji: string }[]>([]);

  const configured = isSupabaseConfigured();

  const load = useCallback(async () => {
    if (!configured) {
      setStatus('unavailable');
      return;
    }
    const supabase = createClient();
    const { data, error } = await supabase
      .from('timeline_comments')
      .select('*')
      .eq('tmdb_id', Number(tmdbId))
      .eq('media_type', mediaType)
      .eq('season_num', season)
      .eq('episode_num', episode)
      .order('timestamp_sec', { ascending: true })
      .limit(200);

    if (error) {
      setStatus('unavailable');
      return;
    }
    const rows = (data ?? []) as TimelineComment[];
    setComments(rows);
    onCommentsLoaded?.(rows);
    setStatus('idle');
  }, [configured, tmdbId, mediaType, season, episode, onCommentsLoaded]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!configured) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`comments:${mediaType}:${tmdbId}:${season}:${episode}`)
      .on('broadcast', { event: 'reaction' }, ({ payload }) => {
        const emoji = (payload as { emoji?: string }).emoji;
        if (!emoji) return;
        const id = Date.now() + Math.random();
        setBursts((prev) => [...prev, { id, emoji }]);
        setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== id)), 2500);
      })
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [configured, mediaType, tmdbId, season, episode]);

  async function submit() {
    if (!body.trim() || !configured) return;
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('timeline_comments').insert({
      tmdb_id: Number(tmdbId),
      media_type: mediaType,
      season_num: season,
      episode_num: episode,
      timestamp_sec: Math.floor(currentTime),
      body: body.trim(),
      author: user.email ?? 'Anonymous',
      user_id: user.id,
    });

    if (!error) {
      setBody('');
      void load();
    }
  }

  function react(emoji: string) {
    if (!configured) return;
    const supabase = createClient();
    void supabase
      .channel(`comments:${mediaType}:${tmdbId}:${season}:${episode}`)
      .send({ type: 'broadcast', event: 'reaction', payload: { emoji } });

    const id = Date.now() + Math.random();
    setBursts((prev) => [...prev, { id, emoji }]);
    setTimeout(() => setBursts((prev) => prev.filter((b) => b.id !== id)), 2500);
  }

  if (status === 'unavailable') return null;

  return (
    <section className="relative space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {bursts.map((burst, i) => (
          <span
            key={burst.id}
            className="absolute animate-fade-in-up text-2xl"
            style={{ left: `${10 + ((i * 17) % 80)}%`, bottom: '10%' }}
          >
            {burst.emoji}
          </span>
        ))}
      </div>

      <h3 className="flex items-center gap-2 text-sm font-bold text-white">
        <MessageSquare className="h-4 w-4 text-rose-500" />
        Timeline comments
        <span className="ml-auto font-mono text-[11px] text-zinc-500">{comments.length}</span>
      </h3>

      <div className="flex gap-1.5">
        {REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => react(emoji)}
            className="rounded-lg border border-zinc-800 bg-zinc-800/60 px-2 py-1 text-sm transition-colors hover:border-zinc-600"
          >
            {emoji}
          </button>
        ))}
        <span className="flex items-center gap-1 pl-1 text-[11px] text-zinc-500">
          <Smile className="h-3 w-3" />
          live reactions
        </span>
      </div>

      <div className="custom-scrollbar max-h-56 space-y-2 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <p className="py-4 text-center text-xs text-zinc-500">
            No comments yet. Be the first to react to a moment.
          </p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex gap-2 text-xs">
              <button
                onClick={() => onSeek?.(comment.timestamp_sec)}
                className="shrink-0 rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] text-sky-400 transition-colors hover:bg-zinc-700"
              >
                {formatTime(comment.timestamp_sec)}
              </button>
              <div className="min-w-0">
                <span className="font-semibold text-zinc-300">{comment.author}</span>
                <p className="break-words text-zinc-400">{comment.body}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit();
          }}
          placeholder={`Comment at ${formatTime(currentTime)}…`}
          className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-rose-600 focus:outline-none"
        />
        <button
          onClick={() => void submit()}
          disabled={!body.trim()}
          aria-label="Post comment"
          className="rounded-lg bg-rose-600 p-2 text-white transition-colors hover:bg-rose-500 disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </section>
  );
}
