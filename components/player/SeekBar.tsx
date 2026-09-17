'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { cueAt, type ThumbnailCue } from '@/lib/player/thumbnails';
import type { SkipRange } from '@/lib/player/chapters';

export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
}

interface SeekBarProps {
  currentTime: number;
  duration: number;
  buffered: number;
  thumbnails: ThumbnailCue[];
  skipRanges: SkipRange[];
  markers: TimelineMarker[];
  onSeek: (time: number) => void;
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

export default function SeekBar({
  currentTime,
  duration,
  buffered,
  thumbnails,
  skipRanges,
  markers,
  onSeek,
}: SeekBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hoverRatio, setHoverRatio] = useState<number | null>(null);
  const [scrubbing, setScrubbing] = useState(false);

  const ratioFromEvent = useCallback((clientX: number): number => {
    const track = trackRef.current;
    if (!track) return 0;
    const rect = track.getBoundingClientRect();
    return Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
  }, []);

  const hoverTime = hoverRatio !== null && duration ? hoverRatio * duration : null;
  const preview = useMemo(
    () => (hoverTime !== null ? cueAt(thumbnails, hoverTime) : null),
    [thumbnails, hoverTime]
  );

  const progressRatio = duration > 0 ? Math.min(currentTime / duration, 1) : 0;
  const bufferedRatio = duration > 0 ? Math.min(buffered / duration, 1) : 0;

  const commit = useCallback(
    (clientX: number) => {
      if (!duration) return;
      onSeek(ratioFromEvent(clientX) * duration);
    },
    [duration, onSeek, ratioFromEvent]
  );

  return (
    <div className="group/seek relative w-full select-none px-1">
      {hoverRatio !== null && hoverTime !== null && (
        <div
          className="pointer-events-none absolute bottom-6 z-20 -translate-x-1/2"
          style={{ left: `${hoverRatio * 100}%` }}
        >
          <div className="overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900 shadow-2xl">
            {preview && preview.width > 0 ? (
              <div
                style={{
                  width: preview.width,
                  height: preview.height,
                  backgroundImage: `url(${preview.url})`,
                  backgroundPosition: `-${preview.x}px -${preview.y}px`,
                }}
              />
            ) : null}
            <div className="bg-zinc-900 px-2 py-1 text-center font-mono text-[11px] text-white">
              {formatTime(hoverTime)}
            </div>
          </div>
        </div>
      )}

      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label="Seek"
        aria-valuemin={0}
        aria-valuemax={Math.floor(duration) || 0}
        aria-valuenow={Math.floor(currentTime) || 0}
        aria-valuetext={formatTime(currentTime)}
        className="relative h-6 cursor-pointer"
        onMouseMove={(e) => setHoverRatio(ratioFromEvent(e.clientX))}
        onMouseLeave={() => {
          if (!scrubbing) setHoverRatio(null);
        }}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setScrubbing(true);
          commit(e.clientX);
        }}
        onPointerMove={(e) => {
          if (!scrubbing) return;
          setHoverRatio(ratioFromEvent(e.clientX));
          commit(e.clientX);
        }}
        onPointerUp={(e) => {
          e.currentTarget.releasePointerCapture(e.pointerId);
          setScrubbing(false);
          setHoverRatio(null);
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') onSeek(Math.min(currentTime + 5, duration));
          if (e.key === 'ArrowLeft') onSeek(Math.max(currentTime - 5, 0));
        }}
      >
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 overflow-hidden rounded-full bg-white/25 transition-all group-hover/seek:h-1.5">
          <div className="absolute inset-y-0 left-0 bg-white/30" style={{ width: `${bufferedRatio * 100}%` }} />
          <div className="absolute inset-y-0 left-0 bg-rose-600" style={{ width: `${progressRatio * 100}%` }} />

          {duration > 0 &&
            skipRanges.map((range) => (
              <div
                key={`${range.kind}-${range.start}`}
                className="absolute inset-y-0 bg-amber-400/50"
                style={{
                  left: `${(range.start / duration) * 100}%`,
                  width: `${((range.end - range.start) / duration) * 100}%`,
                }}
              />
            ))}
        </div>

        {duration > 0 &&
          markers.map((marker) => (
            <span
              key={marker.id}
              title={marker.label}
              className="absolute top-1/2 h-2.5 w-1 -translate-y-1/2 rounded-sm bg-sky-400"
              style={{ left: `${(marker.time / duration) * 100}%` }}
            />
          ))}

        <div
          className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-600 opacity-0 shadow transition-opacity group-hover/seek:opacity-100"
          style={{ left: `${progressRatio * 100}%` }}
        />
      </div>
    </div>
  );
}
