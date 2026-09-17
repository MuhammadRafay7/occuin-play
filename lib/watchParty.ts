'use client';

import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient, isSupabaseConfigured } from '@/lib/supabase';

export type PartyEventType = 'play' | 'pause' | 'seek' | 'sync-request' | 'sync-reply';

export interface PartyEvent {
  type: PartyEventType;
  time: number;
  sentAt: number;
  senderId: string;
  rate?: number;
}

export interface PartyMember {
  id: string;
  name: string;
}

export interface PartyConnection {
  channel: RealtimeChannel;
  send: (event: Omit<PartyEvent, 'sentAt' | 'senderId'>) => void;
  leave: () => Promise<void>;
}

export function createPartyId(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

export function latencyAdjustedTime(event: PartyEvent, isPlaying: boolean): number {
  if (!isPlaying) return event.time;
  const elapsed = (Date.now() - event.sentAt) / 1000;
  const drift = Number.isFinite(elapsed) && elapsed >= 0 ? Math.min(elapsed, 30) : 0;
  return event.time + drift * (event.rate ?? 1);
}

export function joinParty(options: {
  roomId: string;
  selfId: string;
  displayName: string;
  onEvent: (event: PartyEvent) => void;
  onMembers: (members: PartyMember[]) => void;
}): PartyConnection | null {
  if (!isSupabaseConfigured()) return null;

  const supabase = createClient();
  const channel = supabase.channel(`watch-party:${options.roomId}`, {
    config: { presence: { key: options.selfId }, broadcast: { self: false } },
  });

  channel
    .on('broadcast', { event: 'player' }, ({ payload }) => {
      const event = payload as PartyEvent;
      if (!event || event.senderId === options.selfId) return;
      options.onEvent(event);
    })
    .on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState<{ name: string }>();
      const members = Object.entries(state).map(([id, entries]) => ({
        id,
        name: entries[0]?.name ?? 'Guest',
      }));
      options.onMembers(members);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        void channel.track({ name: options.displayName });
      }
    });

  return {
    channel,
    send(event) {
      void channel.send({
        type: 'broadcast',
        event: 'player',
        payload: { ...event, sentAt: Date.now(), senderId: options.selfId } satisfies PartyEvent,
      });
    },
    async leave() {
      await channel.unsubscribe();
    },
  };
}
