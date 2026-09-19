'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Search, X } from 'lucide-react';
import { searchCatalog } from '@/lib/tmdb-browser';
import { titleOf, yearOf, type MediaItem } from '@/lib/types';

const DEBOUNCE_MS = 350;

export default function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const [movies, shows] = await Promise.all([
          searchCatalog(query, 'movie', controller.signal),
          searchCatalog(query, 'tv', controller.signal),
        ]);
        if (controller.signal.aborted) return;
        const merged = [
          ...movies.slice(0, 5).map((m) => ({ ...m, media_type: 'movie' as const })),
          ...shows.slice(0, 5).map((s) => ({ ...s, media_type: 'tv' as const })),
        ].sort((a, b) => b.vote_average - a.vote_average);
        setResults(merged.slice(0, 8));
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const showDropdown = open && query.trim().length > 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      <input
        type="search"
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false);
          if (e.key === 'Enter' && results[0]) {
            router.push(`/watch/${results[0].media_type ?? 'movie'}/${results[0].id}`);
            setOpen(false);
          }
        }}
        placeholder="Search titles…"
        aria-label="Search titles"
        className="w-full rounded-full border border-zinc-800 bg-[#0a1f14]/70 py-2 pl-9 pr-8 text-xs text-white backdrop-blur-md transition-all placeholder:text-zinc-500 focus:border-emerald-500/60 focus:bg-[#0a1f14]"
      />
      {loading && (
        <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-emerald-400" />
      )}
      {!loading && query && (
        <button
          onClick={() => {
            setQuery('');
            setResults([]);
          }}
          aria-label="Clear search"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-xl border border-zinc-800 bg-[#0a1f14]/95 p-1.5 shadow-2xl backdrop-blur-md custom-scrollbar">
          {results.length === 0 && !loading ? (
            <p className="px-3 py-4 text-center text-xs text-zinc-500">No matches found.</p>
          ) : (
            results.map((item) => {
              const type = item.media_type ?? 'movie';
              return (
                <Link
                  key={`${type}-${item.id}`}
                  href={`/watch/${type}/${item.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/5"
                >
                  <div className="relative h-14 w-10 shrink-0 overflow-hidden rounded bg-zinc-900">
                    {item.poster_path && (
                      <Image
                        src={`https://image.tmdb.org/t/p/w154${item.poster_path}`}
                        alt=""
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-zinc-100">{titleOf(item)}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                      {type} · {yearOf(item)}
                    </p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
