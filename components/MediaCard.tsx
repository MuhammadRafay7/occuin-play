'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Heart, Play, Plus, Star } from 'lucide-react';
import { useEpisodeProgress } from '@/hooks/useWatchProgress';
import { useWatchlistEntry } from '@/hooks/useWatchlist';
import { titleOf, yearOf, type MediaItem, type MediaType } from '@/lib/types';

interface MediaCardProps {
  item: MediaItem;
  type: MediaType;
  showProgress?: boolean;
}

export default function MediaCard({ item, type, showProgress = true }: MediaCardProps) {
  const router = useRouter();
  const mediaType = item.media_type ?? type;
  const id = String(item.id);
  const title = titleOf(item);

  const { percent, completed } = useEpisodeProgress(mediaType, id);
  const { saved, liked, toggleSaved, toggleLiked } = useWatchlistEntry(mediaType, id);

  const payload = {
    title,
    posterPath: item.poster_path,
    backdropPath: item.backdrop_path,
  };

  const href = `/watch/${mediaType}/${id}`;

  return (
    <div className="group/card relative">
      <Link
        href={href}
        className="block overflow-hidden rounded-xl border border-zinc-800/80 bg-[#0a1f14] transition-all duration-300 group-hover/card:border-zinc-700 group-hover/card:shadow-2xl group-hover/card:shadow-black/60"
      >
        <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#04120b]">
          {item.poster_path ? (
            <Image
              src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
              alt={title}
              fill
              sizes="(max-width: 640px) 40vw, (max-width: 1024px) 22vw, 15vw"
              className="object-cover transition-transform duration-500 group-hover/card:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-3 text-center text-xs text-zinc-600">
              {title}
            </div>
          )}

          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md border border-white/10 bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-amber-400 backdrop-blur-md">
            <Star className="h-2.5 w-2.5 fill-amber-400" />
            {item.vote_average ? item.vote_average.toFixed(1) : 'NR'}
          </div>

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover/card:opacity-100" />

          <div className="absolute inset-x-0 bottom-0 translate-y-2 p-2.5 opacity-0 transition-all duration-300 group-hover/card:translate-y-0 group-hover/card:opacity-100">
            <div className="flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  router.push(href);
                }}
                aria-label={`Play ${title}`}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-transform hover:scale-110"
              >
                <Play className="ml-0.5 h-3.5 w-3.5 fill-white" />
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleSaved(payload);
                }}
                aria-label={saved ? `Remove ${title} from My List` : `Add ${title} to My List`}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition-transform hover:scale-110"
              >
                {saved ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Plus className="h-3.5 w-3.5" />}
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  toggleLiked(payload);
                }}
                aria-label={liked ? `Unlike ${title}` : `Like ${title}`}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition-transform hover:scale-110"
              >
                <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-emerald-400 text-emerald-400' : ''}`} />
              </button>
            </div>
          </div>

          {showProgress && percent > 0 && (
            <div className="absolute inset-x-0 bottom-0 h-1 bg-black/70">
              <div
                className={`h-full ${completed ? 'bg-emerald-500' : 'bg-emerald-500'}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          )}
        </div>
      </Link>

      <div className="mt-2 space-y-0.5 px-0.5">
        <h3 className="truncate text-xs font-semibold text-zinc-200 transition-colors group-hover/card:text-white">
          {title}
        </h3>
        <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-500">
          <span>{yearOf(item)}</span>
          <span className="uppercase tracking-wider">{mediaType}</span>
          {showProgress && percent > 0 && !completed && (
            <span className="ml-auto text-zinc-400">{percent}%</span>
          )}
        </div>
      </div>
    </div>
  );
}
