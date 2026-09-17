'use client';

import { Play, X } from 'lucide-react';

interface AutoPlayNextModalProps {
  nextEpisodeNumber: number;
  nextEpisodeTitle?: string;
  countdown: number;
  maxSeconds: number;
  onPlayNow: () => void;
  onCancel: () => void;
}

export default function AutoPlayNextModal({
  nextEpisodeNumber,
  nextEpisodeTitle,
  countdown,
  maxSeconds,
  onPlayNow,
  onCancel,
}: AutoPlayNextModalProps) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const ratio = maxSeconds > 0 ? Math.min(Math.max(countdown / maxSeconds, 0), 1) : 0;
  const strokeDashoffset = circumference - ratio * circumference;

  return (
    <div
      role="dialog"
      aria-label="Up next"
      className="absolute bottom-6 right-6 z-30 flex max-w-sm animate-fade-in-up items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/95 p-4 shadow-2xl backdrop-blur-md"
    >
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r={radius} className="stroke-zinc-800" strokeWidth="4" fill="transparent" />
          <circle
            cx="30"
            cy="30"
            r={radius}
            className="stroke-rose-600 transition-all duration-1000 ease-linear"
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <span className="absolute font-mono text-sm font-bold text-white">{countdown}s</span>
      </div>

      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-rose-500">Up Next</p>
        <h4 className="truncate text-sm font-semibold text-white">
          Episode {nextEpisodeNumber}
          {nextEpisodeTitle ? `: ${nextEpisodeTitle}` : ''}
        </h4>
        <p className="text-xs text-zinc-400">Playing next episode automatically...</p>
      </div>

      <div className="flex shrink-0 flex-col gap-1.5">
        <button
          onClick={onPlayNow}
          className="rounded-xl bg-rose-600 p-2 text-white shadow-md shadow-rose-950/40 transition-all hover:bg-rose-500"
          title="Play next now"
          aria-label="Play next episode now"
        >
          <Play className="h-4 w-4 fill-white" />
        </button>
        <button
          onClick={onCancel}
          className="rounded-xl border border-zinc-700 bg-zinc-800 p-2 text-zinc-400 transition-all hover:bg-zinc-700 hover:text-white"
          title="Cancel autoplay"
          aria-label="Cancel autoplay"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
