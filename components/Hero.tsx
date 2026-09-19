'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Check, Info, Play, Plus, Star } from 'lucide-react';
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
    return <div className="h-[86vh] min-h-[560px] w-full animate-pulse bg-[#0a1f14]" />;
  }

  const title = titleOf(featured);
  const watchHref = `/watch/${mediaType}/${featured.id}`;

  return (
    <section className="relative h-[86vh] min-h-[560px] w-full overflow-hidden">
      {featured.backdrop_path && (
        <Image
          key={featured.id}
          src={`https://image.tmdb.org/t/p/original${featured.backdrop_path}`}
          alt=""
          fill
          priority
          sizes="100vw"
          className="animate-fade-in object-cover object-center"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-[#04120b] via-transparent to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#04120b]/95 via-[#04120b]/30 to-transparent" />

      <div className="relative mx-auto flex h-full max-w-[1600px] flex-col justify-center px-4 sm:px-6">
        <div className="max-w-xl space-y-5">
          <h1 className="text-4xl font-black leading-[1.02] tracking-tight text-white drop-shadow-2xl sm:text-6xl">
            {title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-zinc-200">
            {featured.vote_average > 0 && (
              <span className="flex items-center gap-1.5 font-semibold">
                <Star className="h-4 w-4 fill-white text-white" />
                {featured.vote_average.toFixed(1)}/10
              </span>
            )}
            <span className="text-zinc-500">·</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {yearOf(featured)}
            </span>
            <span className="text-zinc-500">·</span>
            <span>{mediaType === 'tv' ? 'Series' : 'Film'}</span>
          </div>

          {featured.overview && (
            <p className="line-clamp-4 max-w-lg text-[15px] leading-relaxed text-zinc-200/90 drop-shadow">
              {featured.overview}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Link
              href={watchHref}
              className="flex items-center gap-2.5 rounded-full bg-white px-7 py-3.5 text-[15px] font-semibold text-[#04120b] transition-transform hover:scale-[1.03]"
            >
              <Play className="h-4 w-4 fill-[#04120b]" />
              Play
            </Link>

            <div className="flex items-center rounded-full border border-white/20 bg-black/40 backdrop-blur-xl">
              <button
                onClick={() =>
                  toggleSaved({
                    title,
                    posterPath: featured.poster_path,
                    backdropPath: featured.backdrop_path,
                  })
                }
                aria-label={saved ? 'Remove from My List' : 'Add to My List'}
                className="rounded-full px-5 py-3.5 text-white transition-colors hover:bg-white/10"
              >
                {saved ? <Check className="h-4 w-4 text-emerald-400" /> : <Plus className="h-4 w-4" />}
              </button>
              <span className="h-6 w-px bg-white/20" />
              <Link
                href={watchHref}
                aria-label="More info"
                className="rounded-full px-5 py-3.5 text-white transition-colors hover:bg-white/10"
              >
                <Info className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>

        {items.length > 1 && (
          <div className="absolute bottom-24 right-6 flex items-center gap-2">
            {items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => setIndex(i)}
                aria-label={`Show ${titleOf(item)}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? 'w-7 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
