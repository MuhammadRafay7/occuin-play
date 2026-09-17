'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, MonitorPlay } from 'lucide-react';
import type { MediaType } from '@/lib/types';

export interface EmbedProvider {
  id: string;
  name: string;
  build: (params: { tmdbId: string; type: MediaType; season: number; episode: number }) => string;
}

export const PROVIDERS: EmbedProvider[] = [
  {
    id: 'vidlink',
    name: 'Server 1',
    build: ({ tmdbId, type, season, episode }) =>
      type === 'tv'
        ? `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`
        : `https://vidlink.pro/movie/${tmdbId}`,
  },
];

interface PlayerProps {
  tmdbId: string;
  type: MediaType;
  season?: number;
  episode?: number;
  completed?: boolean;
  onMarkWatched?: () => void;
}

export default function Player({
  tmdbId,
  type,
  season = 1,
  episode = 1,
  completed = false,
  onMarkWatched,
}: PlayerProps) {
  const [providerId, setProviderId] = useState(PROVIDERS[0].id);
  const [loading, setLoading] = useState(true);

  const provider = PROVIDERS.find((p) => p.id === providerId) ?? PROVIDERS[0];
  const src = provider.build({ tmdbId, type, season, episode });

  useEffect(() => {
    setLoading(true);
  }, [src]);

  return (
    <div className="w-full space-y-4">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-zinc-800 bg-black shadow-2xl">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-950">
            <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
          </div>
        )}
        <iframe
          key={src}
          src={src}
          title={`Player for ${type} ${tmdbId}`}
          onLoad={() => setLoading(false)}
          className="h-full w-full border-0"
          allowFullScreen
          referrerPolicy="origin"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
        />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 pr-1 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            <MonitorPlay className="h-3.5 w-3.5" />
            Source
          </span>
          {PROVIDERS.length > 1 && PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => setProviderId(p.id)}
              aria-pressed={providerId === p.id}
              className={`rounded px-3 py-1.5 text-xs font-semibold transition-colors ${
                providerId === p.id
                  ? 'bg-rose-600 text-white'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {onMarkWatched && (
          <button
            onClick={onMarkWatched}
            disabled={completed}
            className={`flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              completed
                ? 'cursor-default border border-emerald-500/30 bg-emerald-950/40 text-emerald-400'
                : 'border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
            }`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {completed ? 'Watched' : 'Mark as watched'}
          </button>
        )}
      </div>

      <p className="text-[11px] leading-relaxed text-zinc-600">
        Embedded sources are third-party and not operated by this app. If one fails to load, try another server.
      </p>
    </div>
  );
}
