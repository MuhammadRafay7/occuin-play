'use client';

import { ChevronDown } from 'lucide-react';
import EpisodeCard from '@/components/EpisodeCard';
import type { Episode, Season } from '@/lib/types';

interface SeasonSelectorProps {
  tvId: string;
  seasons: Season[];
  selectedSeason: number;
  currentSeason: number;
  currentEpisode: number;
  episodes: Episode[];
  loading: boolean;
  error: string | null;
  onSeasonChange: (season: number) => void;
  onSelectEpisode: (season: number, episode: number) => void;
}

export default function SeasonSelector({
  tvId,
  seasons,
  selectedSeason,
  currentSeason,
  currentEpisode,
  episodes,
  loading,
  error,
  onSeasonChange,
  onSelectEpisode,
}: SeasonSelectorProps) {
  return (
    <section className="w-full space-y-6 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 backdrop-blur-md sm:p-6">
      <div className="flex flex-col justify-between gap-4 border-b border-zinc-800 pb-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Episodes</h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            Select a season and episode to start watching
          </p>
        </div>

        <div className="relative min-w-[200px]">
          <label htmlFor="season-select" className="sr-only">
            Season
          </label>
          <select
            id="season-select"
            value={selectedSeason}
            onChange={(e) => onSeasonChange(Number(e.target.value))}
            className="w-full cursor-pointer appearance-none rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 pr-10 text-sm font-semibold text-white transition-all focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {seasons.map((season) => (
              <option key={season.id} value={season.season_number}>
                {season.name || `Season ${season.season_number}`} ({season.episode_count} eps)
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-zinc-800 bg-zinc-800/50"
            />
          ))}
        </div>
      ) : error ? (
        <div className="py-12 text-center text-sm text-zinc-400">
          <p className="font-semibold text-zinc-300">Could not load episodes</p>
          <p className="mt-1 text-xs text-zinc-500">{error}</p>
        </div>
      ) : episodes.length > 0 ? (
        <div className="custom-scrollbar grid max-h-[520px] grid-cols-1 gap-4 overflow-y-auto pr-1 md:grid-cols-2">
          {episodes.map((ep) => (
            <EpisodeCard
              key={ep.id}
              tvId={tvId}
              seasonNumber={selectedSeason}
              episode={ep}
              isActive={selectedSeason === currentSeason && ep.episode_number === currentEpisode}
              onSelect={() => onSelectEpisode(selectedSeason, ep.episode_number)}
            />
          ))}
        </div>
      ) : (
        <div className="py-12 text-center text-sm text-zinc-500">
          No episode details available for this season.
        </div>
      )}
    </section>
  );
}
