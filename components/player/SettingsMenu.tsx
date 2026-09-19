'use client';

import { useState } from 'react';
import { Check, ChevronLeft } from 'lucide-react';
import type { Preferences, QualityCap, SubtitleStyle } from '@/lib/preferences';

export interface TrackOption {
  id: number;
  label: string;
  active: boolean;
}

interface SettingsMenuProps {
  preferences: Preferences;
  audioTracks: TrackOption[];
  textTracks: TrackOption[];
  qualityLevels: { id: number; label: string; active: boolean }[];
  onUpdate: (patch: Partial<Preferences>) => void;
  onSelectAudio: (id: number) => void;
  onSelectText: (id: number) => void;
  onSelectQuality: (id: number) => void;
}

const SPEEDS = [0.25, 0.5, 1, 1.25, 1.5, 2];
const QUALITY_CAPS: QualityCap[] = ['auto', '1080', '720', '480'];

type Panel = 'root' | 'speed' | 'audio' | 'subtitles' | 'subtitleStyle' | 'quality';

export default function SettingsMenu({
  preferences,
  audioTracks,
  textTracks,
  qualityLevels,
  onUpdate,
  onSelectAudio,
  onSelectText,
  onSelectQuality,
}: SettingsMenuProps) {
  const [panel, setPanel] = useState<Panel>('root');

  const row = (label: string, value: string, onClick: () => void) => (
    <button
      key={label}
      onClick={onClick}
      className="flex w-full items-center justify-between gap-6 rounded-lg px-3 py-2 text-left text-xs text-zinc-200 transition-colors hover:bg-white/10"
    >
      <span>{label}</span>
      <span className="text-zinc-400">{value}</span>
    </button>
  );

  const option = (label: string, active: boolean, onClick: () => void) => (
    <button
      key={label}
      onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-zinc-200 transition-colors hover:bg-white/10"
    >
      <Check className={`h-3.5 w-3.5 ${active ? 'text-emerald-400' : 'text-transparent'}`} />
      {label}
    </button>
  );

  const header = (title: string) => (
    <button
      onClick={() => setPanel('root')}
      className="mb-1 flex w-full items-center gap-2 border-b border-white/10 px-2 py-2 text-xs font-semibold text-white"
    >
      <ChevronLeft className="h-4 w-4" />
      {title}
    </button>
  );

  const updateSubtitleStyle = (patch: Partial<SubtitleStyle>) =>
    onUpdate({ subtitleStyle: { ...preferences.subtitleStyle, ...patch } });

  return (
    <div className="absolute bottom-16 right-2 z-30 max-h-[320px] w-64 overflow-y-auto rounded-xl border border-white/10 bg-black/95 p-2 shadow-2xl backdrop-blur-md">
      {panel === 'root' && (
        <div className="space-y-0.5">
          {row('Playback speed', `${preferences.playbackRate}x`, () => setPanel('speed'))}
          {qualityLevels.length > 0 &&
            row('Quality', qualityLevels.find((q) => q.active)?.label ?? 'Auto', () => setPanel('quality'))}
          {audioTracks.length > 0 &&
            row('Audio', audioTracks.find((t) => t.active)?.label ?? 'Default', () => setPanel('audio'))}
          {row('Subtitles', textTracks.find((t) => t.active)?.label ?? 'Off', () => setPanel('subtitles'))}
          {row('Subtitle style', `${preferences.subtitleStyle.fontSize}%`, () => setPanel('subtitleStyle'))}

          <button
            onClick={() => onUpdate({ audioBoost: !preferences.audioBoost })}
            className="flex w-full items-center justify-between gap-6 rounded-lg px-3 py-2 text-left text-xs text-zinc-200 transition-colors hover:bg-white/10"
          >
            <span>Night mode audio</span>
            <span className={preferences.audioBoost ? 'text-emerald-400' : 'text-zinc-400'}>
              {preferences.audioBoost ? 'On' : 'Off'}
            </span>
          </button>

          <button
            onClick={() => onUpdate({ autoPlayNext: !preferences.autoPlayNext })}
            className="flex w-full items-center justify-between gap-6 rounded-lg px-3 py-2 text-left text-xs text-zinc-200 transition-colors hover:bg-white/10"
          >
            <span>Autoplay next</span>
            <span className={preferences.autoPlayNext ? 'text-emerald-400' : 'text-zinc-400'}>
              {preferences.autoPlayNext ? 'On' : 'Off'}
            </span>
          </button>

          <button
            onClick={() => onUpdate({ autoSkipIntro: !preferences.autoSkipIntro })}
            className="flex w-full items-center justify-between gap-6 rounded-lg px-3 py-2 text-left text-xs text-zinc-200 transition-colors hover:bg-white/10"
          >
            <span>Auto-skip intro</span>
            <span className={preferences.autoSkipIntro ? 'text-emerald-400' : 'text-zinc-400'}>
              {preferences.autoSkipIntro ? 'On' : 'Off'}
            </span>
          </button>
        </div>
      )}

      {panel === 'speed' && (
        <div>
          {header('Playback speed')}
          {SPEEDS.map((speed) =>
            option(`${speed}x`, preferences.playbackRate === speed, () => onUpdate({ playbackRate: speed }))
          )}
        </div>
      )}

      {panel === 'quality' && (
        <div>
          {header('Quality')}
          {QUALITY_CAPS.map((cap) =>
            option(cap === 'auto' ? 'Auto' : `${cap}p max`, preferences.qualityCap === cap, () =>
              onUpdate({ qualityCap: cap })
            )
          )}
          <div className="my-1 border-t border-white/10" />
          {qualityLevels.map((level) => option(level.label, level.active, () => onSelectQuality(level.id)))}
        </div>
      )}

      {panel === 'audio' && (
        <div>
          {header('Audio track')}
          {audioTracks.map((track) => option(track.label, track.active, () => onSelectAudio(track.id)))}
        </div>
      )}

      {panel === 'subtitles' && (
        <div>
          {header('Subtitles')}
          {option('Off', !textTracks.some((t) => t.active), () => onSelectText(-1))}
          {textTracks.map((track) => option(track.label, track.active, () => onSelectText(track.id)))}
        </div>
      )}

      {panel === 'subtitleStyle' && (
        <div className="space-y-3 p-2">
          {header('Subtitle style')}

          <label className="block space-y-1 text-[11px] text-zinc-300">
            <span className="flex justify-between">
              Font size <span className="text-zinc-500">{preferences.subtitleStyle.fontSize}%</span>
            </span>
            <input
              type="range"
              min={50}
              max={250}
              step={10}
              value={preferences.subtitleStyle.fontSize}
              onChange={(e) => updateSubtitleStyle({ fontSize: Number(e.target.value) })}
              className="w-full accent-emerald-500"
            />
          </label>

          <label className="block space-y-1 text-[11px] text-zinc-300">
            <span className="flex justify-between">
              Background <span className="text-zinc-500">{preferences.subtitleStyle.backgroundOpacity}%</span>
            </span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={preferences.subtitleStyle.backgroundOpacity}
              onChange={(e) => updateSubtitleStyle({ backgroundOpacity: Number(e.target.value) })}
              className="w-full accent-emerald-500"
            />
          </label>

          <label className="block space-y-1 text-[11px] text-zinc-300">
            <span className="flex justify-between">
              Vertical offset <span className="text-zinc-500">{preferences.subtitleStyle.verticalOffset}px</span>
            </span>
            <input
              type="range"
              min={-200}
              max={100}
              step={10}
              value={preferences.subtitleStyle.verticalOffset}
              onChange={(e) => updateSubtitleStyle({ verticalOffset: Number(e.target.value) })}
              className="w-full accent-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between text-[11px] text-zinc-300">
            Text color
            <input
              type="color"
              value={preferences.subtitleStyle.color}
              onChange={(e) => updateSubtitleStyle({ color: e.target.value })}
              className="h-6 w-10 cursor-pointer rounded border border-white/20 bg-transparent"
            />
          </label>
        </div>
      )}
    </div>
  );
}
