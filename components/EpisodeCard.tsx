'use client';

import Image from 'next/image';
import { Calendar, CheckCircle2, Clock, Play, Star } from 'lucide-react';
import { useEpisodeProgress } from '@/hooks/useWatchProgress';
import type { Episode } from '@/lib/types';

interface EpisodeCardProps {
  tvId: string;
  seasonNumber: number;
  episode: Episode;
  isActive: boolean;
  onSelect: () => void;
}

export default function EpisodeCard({
  tvId,
  seasonNumber,
  episode,
  isActive,
  onSelect,
}: EpisodeCardProps) {
  const { percent, completed } = useEpisodeProgress('tv', tvId, seasonNumber, episode.episode_number);

  return (
    <button
      onClick={onSelect}
      aria-current={isActive}
      className={`group relative flex gap-3 rounded-xl border p-3 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        isActive
          ? 'border-emerald-500/80 bg-emerald-950/30 shadow-lg shadow-emerald-950/30'
          : 'border-zinc-800 bg-zinc-900/80 hover:border-zinc-700 hover:bg-zinc-800/60'
      }`}
    >
      <div className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg border border-zinc-800/80 bg-zinc-950">
        {episode.still_path ? (
          <Image
            src={`https://image.tmdb.org/t/p/w300${episode.still_path}`}
            alt={episode.name}
            fill
            sizes="128px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-600">
            No preview
          </div>
        )}

        <div
          className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-opacity ${
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
            <Play className="ml-0.5 h-4 w-4 fill-white" />
          </div>
        </div>

        {completed && (
          <div className="absolute left-1.5 top-1.5 flex items-center gap-1 rounded border border-emerald-500/30 bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400 backdrop-blur-md">
            <CheckCircle2 className="h-3 w-3 text-emerald-400" />
            <span>Watched</span>
          </div>
        )}

        {percent > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-zinc-950/80">
            <div
              className={`h-full transition-all duration-300 ${completed ? 'bg-emerald-500' : 'bg-emerald-500'}`}
              style={{ width: `${percent}%` }}
            />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs font-bold text-emerald-400">EP {episode.episode_number}</span>
            {episode.vote_average > 0 && (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-yellow-400">
                <Star className="h-3 w-3 fill-yellow-400" />
                <span>{episode.vote_average.toFixed(1)}</span>
              </div>
            )}
          </div>
          <h3
            className={`truncate text-sm font-semibold transition-colors ${
              isActive ? 'text-emerald-300' : 'text-zinc-100 group-hover:text-white'
            }`}
          >
            {episode.name}
          </h3>
          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-400">
            {episode.overview || 'No description available for this episode.'}
          </p>
        </div>

        <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-zinc-500">
          <span className="flex items-center gap-3">
            {episode.runtime ? (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {episode.runtime}m
              </span>
            ) : null}
            {episode.air_date ? (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {episode.air_date}
              </span>
            ) : null}
          </span>

          {percent > 0 && !completed && (
            <span className="font-sans text-[10px] font-medium text-zinc-400">{percent}% watched</span>
          )}
        </div>
      </div>
    </button>
  );
}
