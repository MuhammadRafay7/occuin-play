'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, Trash2, Upload } from 'lucide-react';
import KeymapModal from '@/components/KeymapModal';
import { usePreferences } from '@/hooks/usePreferences';
import {
  clearAllProgress,
  exportHistory,
  importHistory,
  readAllProgress,
  WATCH_HISTORY_EVENT,
  type WatchProgress,
} from '@/lib/watchHistory';
import type { SkipInterval } from '@/lib/preferences';

const SKIP_INTERVALS: SkipInterval[] = [5, 10, 15, 30];

export default function SettingsPage() {
  const { preferences, update, reset } = usePreferences();
  const [entries, setEntries] = useState<WatchProgress[]>([]);
  const [keymapOpen, setKeymapOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => setEntries(readAllProgress()), []);

  useEffect(() => {
    refresh();
    window.addEventListener(WATCH_HISTORY_EVENT, refresh);
    return () => window.removeEventListener(WATCH_HISTORY_EVENT, refresh);
  }, [refresh]);

  function handleExport() {
    const payload = exportHistory();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `occuin-play-history-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(file: File) {
    try {
      const parsed = JSON.parse(await file.text());
      const { applied, skipped } = importHistory(parsed);
      setMessage(`Imported ${applied} entries${skipped ? `, skipped ${skipped} invalid` : ''}.`);
    } catch {
      setMessage('Could not read that file — expected JSON.');
    }
  }

  const toggle = (label: string, value: boolean, onChange: (next: boolean) => void, hint?: string) => (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-zinc-100">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
      </div>
      <button
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          value ? 'bg-rose-600' : 'bg-zinc-700'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            value ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );

  return (
    <main className="mx-auto min-h-screen max-w-3xl space-y-8 p-4 sm:p-8">
      <div className="space-y-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to catalog
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">Settings</h1>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Playback</h2>
        {toggle('Autoplay next episode', preferences.autoPlayNext, (v) => update({ autoPlayNext: v }),
          'Show the countdown overlay and advance automatically.')}
        {toggle('Auto-skip intros', preferences.autoSkipIntro, (v) => update({ autoSkipIntro: v }),
          'Jump past intro and recap ranges without prompting.')}
        {toggle('Prefetch next episode', preferences.prefetchNext, (v) => update({ prefetchNext: v }),
          'Buffer the start of the next episode during the final minutes.')}
        {toggle('Night mode audio', preferences.audioBoost, (v) => update({ audioBoost: v }),
          'Compress dynamic range so quiet dialogue stays audible.')}

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
          <p className="mb-2 text-sm font-medium text-zinc-100">Skip interval</p>
          <div className="flex gap-2">
            {SKIP_INTERVALS.map((interval) => (
              <button
                key={interval}
                onClick={() => update({ skipInterval: interval })}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  preferences.skipInterval === interval
                    ? 'bg-rose-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {interval}s
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Network</h2>
        {toggle('Bandwidth saver', preferences.bandwidthSaver, (v) => update({ bandwidthSaver: v }),
          'Cap streaming quality at 720p on metered connections.')}

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
          <p className="mb-2 text-sm font-medium text-zinc-100">Maximum quality</p>
          <div className="flex flex-wrap gap-2">
            {(['auto', '1080', '720', '480'] as const).map((cap) => (
              <button
                key={cap}
                onClick={() => update({ qualityCap: cap })}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                  preferences.qualityCap === cap
                    ? 'bg-rose-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                }`}
              >
                {cap === 'auto' ? 'Auto' : `${cap}p`}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Controls</h2>
        <button
          onClick={() => setKeymapOpen(true)}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-left text-sm font-medium text-zinc-100 transition-colors hover:border-zinc-700"
        >
          Keyboard shortcuts
          <span className="mt-0.5 block text-xs text-zinc-500">
            View and rebind shortcuts. Press ? during playback.
          </span>
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
          Watch history ({entries.length})
        </h2>

        {message && (
          <p className="rounded-lg border border-sky-500/30 bg-sky-950/30 px-3 py-2 text-xs text-sky-300">
            {message}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-zinc-700"
          >
            <Download className="h-3.5 w-3.5" />
            Export JSON
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-zinc-700"
          >
            <Upload className="h-3.5 w-3.5" />
            Import JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImport(file);
              e.target.value = '';
            }}
          />

          <button
            onClick={() => {
              if (window.confirm('Clear all watch history on this device? This cannot be undone.')) {
                clearAllProgress();
                setMessage('Watch history cleared.');
              }
            }}
            className="flex items-center gap-2 rounded-lg border border-rose-900/60 bg-rose-950/40 px-3 py-2 text-xs font-semibold text-rose-300 transition-colors hover:bg-rose-950/70"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear all
          </button>
        </div>

        <p className="text-xs text-zinc-500">
          Imports merge by last-updated timestamp, so newer progress always wins.
        </p>
      </section>

      <section>
        <button
          onClick={() => {
            reset();
            setMessage('Preferences reset to defaults.');
          }}
          className="text-xs text-zinc-500 underline transition-colors hover:text-zinc-300"
        >
          Reset all preferences
        </button>
      </section>

      {keymapOpen && (
        <KeymapModal preferences={preferences} onUpdate={update} onClose={() => setKeymapOpen(false)} />
      )}
    </main>
  );
}
