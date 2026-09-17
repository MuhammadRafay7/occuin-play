'use client';

import { useState } from 'react';
import { Keyboard, RotateCcw, X } from 'lucide-react';
import { DEFAULT_KEYBINDINGS, type Preferences } from '@/lib/preferences';
import { eventToCombo } from '@/hooks/useKeyboardShortcuts';

const ACTION_LABELS: Record<string, string> = {
  playPause: 'Play / Pause',
  fullscreen: 'Toggle fullscreen',
  mute: 'Mute / Unmute',
  pictureInPicture: 'Picture in picture',
  seekForward: 'Seek forward',
  seekBackward: 'Seek backward',
  volumeUp: 'Volume up',
  volumeDown: 'Volume down',
  nextEpisode: 'Next episode',
  prevEpisode: 'Previous episode',
  frameForward: 'Step forward one frame',
  frameBackward: 'Step back one frame',
  speedUp: 'Increase speed',
  speedDown: 'Decrease speed',
  subtitles: 'Toggle subtitles',
  skipIntro: 'Skip intro',
  help: 'Show this help',
};

interface KeymapModalProps {
  preferences: Preferences;
  onUpdate: (patch: Partial<Preferences>) => void;
  onClose: () => void;
}

export default function KeymapModal({ preferences, onUpdate, onClose }: KeymapModalProps) {
  const [rebinding, setRebinding] = useState<string | null>(null);

  const captureKey = (action: string) => (event: React.KeyboardEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (event.key === 'Escape') {
      setRebinding(null);
      return;
    }
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) return;

    onUpdate({
      keybindings: { ...preferences.keybindings, [action]: eventToCombo(event.nativeEvent) },
    });
    setRebinding(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-label="Keyboard shortcuts"
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-bold text-white">
            <Keyboard className="h-4 w-4 text-rose-500" />
            Keyboard shortcuts
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdate({ keybindings: DEFAULT_KEYBINDINGS })}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-700 px-2.5 py-1.5 text-[11px] text-zinc-300 transition-colors hover:text-white"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
            <button onClick={onClose} aria-label="Close" className="text-zinc-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <p className="mb-3 text-xs text-zinc-500">
          Click a shortcut to rebind it, then press the new key. Escape cancels.
        </p>

        <div className="space-y-1">
          {Object.entries(ACTION_LABELS).map(([action, label]) => (
            <div
              key={action}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 text-xs hover:bg-white/5"
            >
              <span className="text-zinc-300">{label}</span>
              <button
                onClick={() => setRebinding(action)}
                onKeyDown={rebinding === action ? captureKey(action) : undefined}
                className={`min-w-[80px] rounded border px-2 py-1 text-center font-mono text-[11px] transition-colors ${
                  rebinding === action
                    ? 'border-rose-600 bg-rose-950/40 text-rose-300'
                    : 'border-zinc-700 bg-zinc-800 text-zinc-200 hover:border-zinc-600'
                }`}
              >
                {rebinding === action
                  ? 'Press key…'
                  : preferences.keybindings[action] === ' '
                    ? 'Space'
                    : preferences.keybindings[action]}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
