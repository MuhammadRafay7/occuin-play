'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Bookmark, Heart, Play, X } from 'lucide-react';
import { useState } from 'react';
import Playlists from '@/components/Playlists';
import { useWatchlist } from '@/hooks/useWatchlist';
import { removeFromWatchlist } from '@/lib/watchlist';

type Tab = 'all' | 'liked';

export default function MyListPage() {
  const items = useWatchlist();
  const [tab, setTab] = useState<Tab>('all');

  const visible = tab === 'liked' ? items.filter((i) => i.liked) : items;

  return (
    <main className="mx-auto max-w-[1600px] space-y-8 px-4 py-8 sm:px-6">
      <header className="space-y-3">
        <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
          <Bookmark className="h-6 w-6 text-rose-500" />
          My List
        </h1>

        <div className="flex gap-1 rounded-xl border border-zinc-800 bg-[#18181b] p-1">
          {(
            [
              { id: 'all' as const, label: `Saved (${items.length})` },
              { id: 'liked' as const, label: `Liked (${items.filter((i) => i.liked).length})` },
            ]
          ).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
                tab === id ? 'bg-rose-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {visible.length === 0 ? (
        <div className="space-y-2 py-16 text-center">
          <p className="text-base font-semibold text-zinc-300">
            {tab === 'liked' ? 'Nothing liked yet' : 'Your list is empty'}
          </p>
          <p className="text-sm text-zinc-500">
            Hover any poster and use the {tab === 'liked' ? 'heart' : 'plus'} button to add titles here.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white transition-colors hover:bg-rose-500"
          >
            Browse catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {visible.map((item) => (
            <div key={`${item.mediaType}-${item.tmdbId}`} className="group/item relative">
              <Link
                href={`/watch/${item.mediaType}/${item.tmdbId}`}
                className="block overflow-hidden rounded-xl border border-zinc-800/80 bg-[#18181b] transition-all group-hover/item:border-zinc-700"
              >
                <div className="relative aspect-[2/3] bg-[#09090b]">
                  {item.posterPath ? (
                    <Image
                      src={`https://image.tmdb.org/t/p/w500${item.posterPath}`}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 45vw, 15vw"
                      className="object-cover transition-transform duration-500 group-hover/item:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center p-3 text-center text-xs text-zinc-600">
                      {item.title}
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover/item:opacity-100">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-600 shadow-lg">
                      <Play className="ml-0.5 h-4 w-4 fill-white text-white" />
                    </span>
                  </div>

                  {item.liked && (
                    <Heart className="absolute left-2 top-2 h-4 w-4 fill-rose-500 text-rose-500 drop-shadow" />
                  )}
                </div>
              </Link>

              <button
                onClick={() => removeFromWatchlist(item.mediaType, item.tmdbId)}
                aria-label={`Remove ${item.title}`}
                className="absolute right-2 top-2 rounded-md border border-white/10 bg-black/80 p-1 text-zinc-400 opacity-0 backdrop-blur-md transition-opacity hover:text-white group-hover/item:opacity-100 focus:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>

              <div className="mt-2 px-0.5">
                <p className="truncate text-xs font-semibold text-zinc-200">{item.title}</p>
                <p className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  {item.mediaType}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-zinc-800/80 pt-8">
        <Playlists />
      </div>
    </main>
  );
}
