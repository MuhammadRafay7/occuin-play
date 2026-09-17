import 'server-only';
import type { MediaType } from '@/lib/types';

export function sourceKey(type: MediaType, tmdbId: string, season?: number, episode?: number): string {
  return type === 'tv' ? `tv:${tmdbId}:${season ?? 1}:${episode ?? 1}` : `movie:${tmdbId}`;
}

function allowedHosts(): string[] {
  return (process.env.DIRECT_SOURCE_HOSTS ?? '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

function isPermitted(value: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:') return false;

  const hosts = allowedHosts();
  if (hosts.length === 0) return true;

  const host = url.hostname.toLowerCase();
  return hosts.some((h) => host === h || host.endsWith(`.${h}`));
}

function registry(): Record<string, string> {
  const raw = process.env.DIRECT_SOURCES;
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

export function getDirectSources(type: MediaType, tmdbId: string): Record<string, string> {
  const prefix = type === 'tv' ? `tv:${tmdbId}:` : `movie:${tmdbId}`;
  const out: Record<string, string> = {};

  for (const [key, value] of Object.entries(registry())) {
    if (typeof value !== 'string') continue;
    const matches = type === 'tv' ? key.startsWith(prefix) : key === prefix;
    if (matches && isPermitted(value)) out[key] = value;
  }

  return out;
}

export function embedFallbackEnabled(): boolean {
  return (process.env.ALLOW_EMBED_FALLBACK ?? 'true').toLowerCase() !== 'false';
}
