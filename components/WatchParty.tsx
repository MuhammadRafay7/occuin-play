'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, LogOut, Users } from 'lucide-react';
import {
  createPartyId,
  joinParty,
  latencyAdjustedTime,
  type PartyConnection,
  type PartyEvent,
  type PartyMember,
} from '@/lib/watchParty';
import { isSupabaseConfigured } from '@/lib/supabase';

export interface PartyController {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  getTime: () => number;
  isPlaying: () => boolean;
}

interface WatchPartyProps {
  controller: PartyController | null;
}

export default function WatchParty({ controller }: WatchPartyProps) {
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const [members, setMembers] = useState<PartyMember[]>([]);
  const [copied, setCopied] = useState(false);
  const connectionRef = useRef<PartyConnection | null>(null);
  const selfIdRef = useRef(createPartyId());
  const applyingRef = useRef(false);

  const configured = isSupabaseConfigured();

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('party');
    if (fromUrl) setRoomId(fromUrl);
  }, []);

  const handleRemoteEvent = useCallback(
    (event: PartyEvent) => {
      if (!controller) return;
      applyingRef.current = true;

      const target = latencyAdjustedTime(event, event.type === 'play');
      if (Math.abs(controller.getTime() - target) > 1.5) controller.seek(target);

      if (event.type === 'play') controller.play();
      if (event.type === 'pause') controller.pause();

      setTimeout(() => {
        applyingRef.current = false;
      }, 250);
    },
    [controller]
  );

  const connect = useCallback(
    (id: string) => {
      const connection = joinParty({
        roomId: id,
        selfId: selfIdRef.current,
        displayName: `Guest ${selfIdRef.current.slice(0, 3)}`,
        onEvent: handleRemoteEvent,
        onMembers: setMembers,
      });
      if (!connection) return;
      connectionRef.current = connection;
      setJoined(true);
    },
    [handleRemoteEvent]
  );

  useEffect(() => {
    if (!joined || !controller) return;

    const interval = setInterval(() => {
      if (applyingRef.current) return;
      connectionRef.current?.send({
        type: controller.isPlaying() ? 'play' : 'pause',
        time: controller.getTime(),
        rate: 1,
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [joined, controller]);

  useEffect(
    () => () => {
      void connectionRef.current?.leave();
    },
    []
  );

  if (!configured) return null;

  const shareUrl =
    typeof window !== 'undefined' && roomId
      ? `${window.location.origin}${window.location.pathname}?party=${roomId}`
      : '';

  return (
    <section className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
      <h3 className="flex items-center gap-2 text-sm font-bold text-white">
        <Users className="h-4 w-4 text-emerald-400" />
        Watch party
        {joined && (
          <span className="ml-auto font-mono text-[11px] text-zinc-400">
            {members.length} watching
          </span>
        )}
      </h3>

      {!joined ? (
        <div className="flex flex-wrap gap-2">
          <input
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            placeholder="Room code"
            className="min-w-0 flex-1 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-xs uppercase text-white placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none"
          />
          <button
            onClick={() => roomId && connect(roomId)}
            disabled={!roomId}
            className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-400 disabled:opacity-40"
          >
            Join
          </button>
          <button
            onClick={() => {
              const id = createPartyId();
              setRoomId(id);
              connect(id);
            }}
            className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-xs font-semibold text-zinc-200 transition-colors hover:bg-zinc-700"
          >
            Host new
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 font-mono text-xs text-zinc-200">
              {shareUrl}
            </code>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(shareUrl).catch(() => undefined);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
              }}
              aria-label="Copy invite link"
              className="rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-zinc-300 transition-colors hover:text-white"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={() => {
                void connectionRef.current?.leave();
                connectionRef.current = null;
                setJoined(false);
                setMembers([]);
              }}
              aria-label="Leave party"
              className="rounded-lg border border-zinc-700 bg-zinc-800 p-2 text-zinc-300 transition-colors hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-zinc-500">
            Playback state syncs every 5s and on each play, pause or seek, adjusted for latency.
          </p>
        </div>
      )}
    </section>
  );
}
