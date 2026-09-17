'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Info, Play, Plus, Check, Star } from 'lucide-react';
import { useWatchlistEntry } from '@/hooks/useWatchlist';
import { titleOf, yearOf, type MediaItem, type MediaType } from '@/lib/types';

interface HeroProps {
  items: MediaItem[];
  type: MediaType;
}

const ROTATE_MS = 9000;

export default function Hero({ items, type }: HeroProps) {
  const [index, setIndex] = useState(0);
  const featured = items[index];

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % items.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [items.length]);

  const mediaType = featured?.media_type ?? type;
  const { saved, toggleSaved } = useWatchlistEntry(mediaType, String(featured?.id ?? ''));

  if (!featured) {
    return <div className="h-[60vh] min-h-[420px] w-full animate-pulse bg-[#18181b]" />;
  }

  const title = titleOf(featured);

  return (
    <section className="relative h-[68vh] min-h-[460px] w-full overflow-hidden">
      {featured.backdrop_path && (
        <Image
          key={featured.id}
          src={`https://image.tmdb.org/t/p/original${featured.backdrop_path}`}
          alt=""
          fill
          priority
          sizes="100vw"
          className="animate-fade-in object-cover object-top"
        />
      )}

      <div className="absolute inset-0 fade-to-base" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#09090b] via-[#09090b]/60 to-transparent" />

      <div className="relative mx-auto flex h-full max-w-[1600px] flex-col justify-end px-4 pb-16 sm:px-6">
        <div className="max-w-2xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded border border-rose-600/40 bg-rose-950/40 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-rose-400">
              {mediaType === 'tv' ? 'Series' : 'Film'}
            </span>
            <span className="rounded border border-zinc-700 px-1.5 py-0.5 font-mono text-[10px] font-bold text-zinc-300">
              {featured.vote_average >= 7.5 ? '16+' : '13+'}
            </span>
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-zinc-300">
              4K
            </span>
            <span className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-[10px] font-bold text-zinc-300">
              HD
            </span>
          </div>

          <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white drop-shadow-2xl sm:text-6xl">
            {title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300">
            {featured.vote_average > 0 && (
              <span className="flex items-center gap-1 font-semibold text-amber-400">
                <Star className="h-3.5 w-3.5 fill-amber-400" />
                {featured.vote_average.toFixed(1)}
              </span>
            )}
            <span className="font-mono">{yearOf(featured)}</span>
          </div>

          {featured.overview && (
            <p className="line-clamp-3 max-w-xl text-sm leading-relaxed text-zinc-300 drop-shadow">
              {featured.overview}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={`/watch/${mediaType}/${featured.id}`}
              className="flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-rose-950/50 transition-all hover:bg-rose-500"
            >
              <Play className="h-4 w-4 fill-white" />
              Play Now
            </Link>

            <Link
              href={`/watch/${mediaType}/${featured.id}`}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-[#18181b]/70 px-5 py-3 text-sm font-semibold text-zinc-100 backdrop-blur-md transition-all hover:bg-[#27272a]"
            >
              <Info className="h-4 w-4" />
              More Info
            </Link>

            <button
              onClick={() =>
                toggleSaved({
                  title,
                  posterPath: featured.poster_path,
                  backdropPath: featured.backdrop_path,
                })
              }
              aria-label={saved ? 'Remove from My List' : 'Add to My List'}
              className="rounded-xl border border-zinc-700 bg-[#18181b]/70 p-3 text-zinc-100 backdrop-blur-md transition-all hover:bg-[#27272a]"
            >
              {saved ? <Check className="h-4 w-4 text-emerald-400" /> : <Plus className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {items.length > 1 && (
          <div className="mt-8 flex gap-1.5">
            {items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => setIndex(i)}
                aria-label={`Show ${titleOf(item)}`}
                className={`h-1 rounded-full transition-all ${
                  i === index ? 'w-8 bg-rose-600' : 'w-4 bg-zinc-700 hover:bg-zinc-600'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
