'use client';

import {
  ListVideo,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  Settings,
  SkipBack,
  SkipForward,
  StepBack,
  StepForward,
  Volume1,
  Volume2,
  VolumeX,
} from 'lucide-react';
import SeekBar, { type TimelineMarker } from '@/components/player/SeekBar';
import type { SkipRange } from '@/lib/player/chapters';
import type { ThumbnailCue } from '@/lib/player/thumbnails';

interface ControlBarProps {
  playing: boolean;
  currentTime: number;
  duration: number;
  buffered: number;
  volume: number;
  muted: boolean;
  fullscreen: boolean;
  skipInterval: number;
  thumbnails: ThumbnailCue[];
  skipRanges: SkipRange[];
  markers: TimelineMarker[];
  settingsOpen: boolean;
  canStepFrames: boolean;
  hasPrev: boolean;
  hasNext: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onNudge: (delta: number) => void;
  onStepFrame: (direction: 1 | -1) => void;
  onVolume: (value: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onTogglePip: () => void;
  onToggleSettings: () => void;
  onPrevEpisode: () => void;
  onNextEpisode: () => void;
  onOpenEpisodes?: () => void;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const total = Math.floor(seconds);
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${mins}:${pad(secs)}`;
}

export default function ControlBar({
  playing,
  currentTime,
  duration,
  buffered,
  volume,
  muted,
  fullscreen,
  skipInterval,
  thumbnails,
  skipRanges,
  markers,
  settingsOpen,
  canStepFrames,
  hasPrev,
  hasNext,
  onTogglePlay,
  onSeek,
  onNudge,
  onStepFrame,
  onVolume,
  onToggleMute,
  onToggleFullscreen,
  onTogglePip,
  onToggleSettings,
  onPrevEpisode,
  onNextEpisode,
  onOpenEpisodes,
}: ControlBarProps) {
  const VolumeIcon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  const iconButton = (
    key: string,
    label: string,
    Icon: typeof Play,
    onClick: () => void,
    disabled = false,
    active = false
  ) => (
    <button
      key={key}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`rounded-lg p-1.5 transition-colors disabled:opacity-30 ${
        active ? 'text-rose-500' : 'text-white hover:text-rose-400'
      }`}
    >
      <Icon className="h-5 w-5" />
    </button>
  );

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/70 to-transparent px-3 pb-2 pt-10">
      <SeekBar
        currentTime={currentTime}
        duration={duration}
        buffered={buffered}
        thumbnails={thumbnails}
        skipRanges={skipRanges}
        markers={markers}
        onSeek={onSeek}
      />

      <div className="mt-1 flex items-center gap-1">
        {iconButton('play', playing ? 'Pause' : 'Play', playing ? Pause : Play, onTogglePlay)}
        {iconButton('prev', 'Previous episode', SkipBack, onPrevEpisode, !hasPrev)}
        {iconButton('next', 'Next episode', SkipForward, onNextEpisode, !hasNext)}

        <button
          onClick={() => onNudge(-skipInterval)}
          aria-label={`Back ${skipInterval} seconds`}
          title={`Back ${skipInterval}s`}
          className="rounded-lg px-1.5 py-1 font-mono text-[11px] text-white transition-colors hover:text-rose-400"
        >
          −{skipInterval}s
        </button>
        <button
          onClick={() => onNudge(skipInterval)}
          aria-label={`Forward ${skipInterval} seconds`}
          title={`Forward ${skipInterval}s`}
          className="rounded-lg px-1.5 py-1 font-mono text-[11px] text-white transition-colors hover:text-rose-400"
        >
          +{skipInterval}s
        </button>

        {canStepFrames && (
          <>
            {iconButton('frameback', 'Previous frame', StepBack, () => onStepFrame(-1))}
            {iconButton('framefwd', 'Next frame', StepForward, () => onStepFrame(1))}
          </>
        )}

        <div className="group/vol flex items-center">
          {iconButton('mute', muted ? 'Unmute' : 'Mute', VolumeIcon, onToggleMute)}
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => onVolume(Number(e.target.value))}
            aria-label="Volume"
            className="w-0 cursor-pointer accent-rose-600 transition-all group-hover/vol:w-20 focus:w-20"
          />
        </div>

        <span className="ml-2 font-mono text-[11px] text-zinc-300">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <div className="ml-auto flex items-center gap-1">
          {onOpenEpisodes && iconButton('episodes', 'Episodes', ListVideo, onOpenEpisodes)}
          {iconButton('pip', 'Picture in picture', PictureInPicture2, onTogglePip)}
          {iconButton('settings', 'Settings', Settings, onToggleSettings, false, settingsOpen)}
          {iconButton(
            'fullscreen',
            fullscreen ? 'Exit fullscreen' : 'Fullscreen',
            fullscreen ? Minimize : Maximize,
            onToggleFullscreen
          )}
        </div>
      </div>
    </div>
  );
}
