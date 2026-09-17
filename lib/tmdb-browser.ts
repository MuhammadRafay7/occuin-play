import type { Episode, MediaItem, MediaType, TitleDetails } from '@/lib/types';

export type { Episode, MediaItem, MediaType, Season, TitleDetails } from '@/lib/types';

async function call<T>(params: Record<string, string>, signal?: AbortSignal): Promise<T> {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`/api/tmdb?${query}`, { signal });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export async function fetchTrending(type: MediaType, signal?: AbortSignal): Promise<MediaItem[]> {
  const data = await call<{ results: MediaItem[] }>({ action: 'trending', type }, signal);
  return data.results;
}

export async function fetchCatalog(
  type: MediaType,
  catalog: 'popular' | 'top_rated' | 'new',
  signal?: AbortSignal
): Promise<MediaItem[]> {
  const data = await call<{ results: MediaItem[] }>({ action: 'catalog', type, catalog }, signal);
  return data.results;
}

export async function searchCatalog(
  query: string,
  type: MediaType,
  signal?: AbortSignal
): Promise<MediaItem[]> {
  if (!query.trim()) return [];
  const data = await call<{ results: MediaItem[] }>({ action: 'search', query, type }, signal);
  return data.results;
}

export async function fetchTitleDetails(
  type: MediaType,
  id: string,
  signal?: AbortSignal
): Promise<TitleDetails> {
  return call<TitleDetails>({ action: 'details', type, id }, signal);
}

export async function fetchSeasonEpisodes(
  tvId: string,
  season: number,
  signal?: AbortSignal
): Promise<Episode[]> {
  const data = await call<{ episodes: Episode[] }>(
    { action: 'season', tvId, season: String(season) },
    signal
  );
  return data.episodes;
}
