'use client';

import Image from 'next/image';
import Link from 'next/link';
import { History, Play, X } from 'lucide-react';
import { useContinueWatching } from '@/hooks/useWatchProgress';
import { clearWatchProgress, percentWatched } from '@/lib/watchHistory';

export default function ContinueWatchingRail() {
  const entries = useContinueWatching(16);

  if (entries.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 px-4 sm:px-6">
        <History className="h-4 w-4 text-rose-500" />
        <h2 className="text-base font-bold tracking-tight text-white sm:text-lg">Continue Watching</h2>
      </div>

      <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto scroll-smooth px-4 pb-2 sm:px-6">
        {entries.map((entry) => {
          const percent = percentWatched(entry);
          const href = `/watch/${entry.mediaType}/${entry.tmdbId}`;

          return (
            <div
              key={`${entry.mediaType}-${entry.tmdbId}-${entry.season}-${entry.episode}`}
              className="group/cw relative w-[240px] shrink-0 snap-start"
            >
              <Link
                href={href}
                className="block overflow-hidden rounded-xl border border-zinc-800/80 bg-[#18181b] transition-all group-hover/cw:border-zinc-700"
              >
                <div className="relative aspect-video bg-[#09090b]">
                  {entry.posterPath ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${entry.posterPath}`}
                      alt={entry.title ?? 'Poster'}
                      fill
                      sizes="240px"
                      className="object-cover object-top transition-transform duration-500 group-hover/cw:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-3 text-center text-xs text-zinc-600">
                      {entry.title ?? 'Untitled'}
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 backdrop-blur-[2px] transition-opacity group-hover/cw:opacity-100">
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-600 shadow-lg">
                      <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
                    </span>
                  </div>

                  <div className="absolute inset-x-0 bottom-0 h-1 bg-black/70">
                    <div className="h-full bg-rose-600" style={{ width: `${percent}%` }} />
                  </div>
                </div>

                <div className="space-y-0.5 p-2.5">
                  <p className="truncate text-xs font-semibold text-zinc-100">
                    {entry.title ?? `#${entry.tmdbId}`}
                  </p>
                  <p className="font-mono text-[10px] text-zinc-500">
                    {entry.mediaType === 'tv' ? `S${entry.season} · E${entry.episode}` : 'Movie'} · {percent}%
                  </p>
                </div>
              </Link>

              <button
                onClick={() =>
                  clearWatchProgress(entry.mediaType, entry.tmdbId, entry.season, entry.episode)
                }
                aria-label={`Remove ${entry.title ?? 'item'} from Continue Watching`}
                className="absolute right-2 top-2 rounded-md border border-white/10 bg-black/80 p-1 text-zinc-400 opacity-0 backdrop-blur-md transition-opacity hover:text-white group-hover/cw:opacity-100 focus:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
