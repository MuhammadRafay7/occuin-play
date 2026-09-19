'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Copy, ListPlus, Plus, Trash2 } from 'lucide-react';
import {
  createPlaylist,
  decodePlaylist,
  deletePlaylist,
  encodePlaylist,
  importPlaylist,
  listPlaylists,
  removeFromPlaylist,
  PLAYLISTS_EVENT,
  type Playlist,
} from '@/lib/playlists';

export default function Playlists() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [name, setName] = useState('');
  const [importCode, setImportCode] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const refresh = useCallback(() => setPlaylists(listPlaylists()), []);

  useEffect(() => {
    refresh();
    window.addEventListener(PLAYLISTS_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(PLAYLISTS_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  useEffect(() => {
    const shared = new URLSearchParams(window.location.search).get('playlist');
    if (!shared) return;
    const decoded = decodePlaylist(shared);
    if (decoded) {
      importPlaylist(decoded);
      refresh();
    }
  }, [refresh]);

  async function copyShareLink(playlist: Playlist) {
    const url = `${window.location.origin}/?playlist=${encodePlaylist(playlist)}`;
    await navigator.clipboard.writeText(url).catch(() => undefined);
    setCopiedId(playlist.id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <ListPlus className="h-4 w-4 text-emerald-400" />
        Playlists
      </h2>

      <div className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New playlist name"
          className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
        />
        <button
          onClick={() => {
            if (!name.trim()) return;
            createPlaylist(name.trim());
            setName('');
            refresh();
          }}
          disabled={!name.trim()}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-400 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
          Create
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={importCode}
          onChange={(e) => setImportCode(e.target.value)}
          placeholder="Paste a shared playlist link or code"
          className="min-w-0 flex-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
        />
        <button
          onClick={() => {
            const code = importCode.includes('playlist=')
              ? (importCode.split('playlist=')[1] ?? '')
              : importCode;
            const decoded = decodePlaylist(code.trim());
            if (decoded) {
              importPlaylist(decoded);
              setImportCode('');
              refresh();
            }
          }}
          disabled={!importCode.trim()}
          className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-zinc-700 disabled:opacity-40"
        >
          Import
        </button>
      </div>

      {playlists.length === 0 ? (
        <p className="py-4 text-xs text-zinc-500">
          No playlists yet. Create one, then add titles from any watch page.
        </p>
      ) : (
        <div className="space-y-2">
          {playlists.map((playlist) => (
            <div key={playlist.id} className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setExpanded(expanded === playlist.id ? null : playlist.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate text-sm font-semibold text-zinc-100">{playlist.name}</p>
                  <p className="font-mono text-[11px] text-zinc-500">{playlist.items.length} titles</p>
                </button>

                <button
                  onClick={() => void copyShareLink(playlist)}
                  aria-label={`Share ${playlist.name}`}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-zinc-300 transition-colors hover:text-white"
                >
                  {copiedId === playlist.id ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                <button
                  onClick={() => {
                    deletePlaylist(playlist.id);
                    refresh();
                  }}
                  aria-label={`Delete ${playlist.name}`}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-zinc-400 transition-colors hover:text-emerald-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {expanded === playlist.id && playlist.items.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-zinc-800 pt-3">
                  {playlist.items.map((item) => (
                    <li key={`${item.mediaType}-${item.tmdbId}`} className="flex items-center gap-2 text-xs">
                      <Link
                        href={`/watch/${item.mediaType}/${item.tmdbId}`}
                        className="min-w-0 flex-1 truncate text-zinc-300 transition-colors hover:text-white"
                      >
                        {item.title}
                      </Link>
                      <button
                        onClick={() => {
                          removeFromPlaylist(playlist.id, item.tmdbId, item.mediaType);
                          refresh();
                        }}
                        aria-label={`Remove ${item.title}`}
                        className="text-zinc-500 transition-colors hover:text-emerald-300"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
