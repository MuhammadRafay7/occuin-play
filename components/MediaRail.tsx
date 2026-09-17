'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MediaCard from '@/components/MediaCard';
import type { MediaItem, MediaType } from '@/lib/types';

interface MediaRailProps {
  title: string;
  items: MediaItem[];
  type: MediaType;
  loading?: boolean;
  icon?: React.ReactNode;
}

export default function MediaRail({ title, items, type, loading = false, icon }: MediaRailProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateArrows();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [updateArrows, items.length]);

  const scrollBy = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  if (!loading && items.length === 0) return null;

  return (
    <section className="group/rail relative space-y-3">
      <div className="flex items-center gap-2 px-4 sm:px-6">
        {icon}
        <h2 className="text-base font-bold tracking-tight text-white sm:text-lg">{title}</h2>
      </div>

      <div className="relative">
        {canLeft && (
          <button
            onClick={() => scrollBy(-1)}
            aria-label={`Scroll ${title} left`}
            className="absolute left-1 top-1/2 z-20 hidden h-20 -translate-y-1/2 items-center rounded-r-xl border border-zinc-800/80 bg-black/70 px-1 text-white opacity-0 backdrop-blur-md transition-opacity hover:bg-black/90 group-hover/rail:opacity-100 md:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        )}

        {canRight && (
          <button
            onClick={() => scrollBy(1)}
            aria-label={`Scroll ${title} right`}
            className="absolute right-1 top-1/2 z-20 hidden h-20 -translate-y-1/2 items-center rounded-l-xl border border-zinc-800/80 bg-black/70 px-1 text-white opacity-0 backdrop-blur-md transition-opacity hover:bg-black/90 group-hover/rail:opacity-100 md:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        )}

        <div
          ref={scrollerRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2 sm:px-6"
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[140px] shrink-0 sm:w-[160px] lg:w-[180px]"
                >
                  <div className="aspect-[2/3] animate-pulse rounded-xl border border-zinc-800 bg-[#18181b]" />
                </div>
              ))
            : items.map((item) => (
                <div
                  key={`${item.media_type ?? type}-${item.id}`}
                  className="w-[140px] shrink-0 snap-start sm:w-[160px] lg:w-[180px]"
                >
                  <MediaCard item={item} type={type} />
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
