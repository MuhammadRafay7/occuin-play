import 'server-only';
import { TmdbError, type Episode, type MediaItem, type MediaType, type TitleDetails } from '@/lib/types';

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function apiKey(): string {
  const key = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!key || key === 'your_tmdb_key_here') {
    throw new TmdbError('TMDB_API_KEY is not configured', 500);
  }
  return key;
}

async function tmdbFetch<T>(
  path: string,
  params: Record<string, string> = {},
  revalidate = 3600
): Promise<T> {
  const url = new URL(`${TMDB_BASE_URL}${path}`);
  url.searchParams.set('api_key', apiKey());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url, { next: { revalidate } });
  if (!res.ok) {
    throw new TmdbError(`TMDB request failed for ${path}`, res.status);
  }
  return res.json() as Promise<T>;
}

export async function fetchTrending(type: MediaType = 'movie'): Promise<MediaItem[]> {
  const data = await tmdbFetch<{ results: MediaItem[] }>(`/trending/${type}/week`);
  return data.results ?? [];
}

export async function searchCatalog(query: string, type: MediaType = 'movie'): Promise<MediaItem[]> {
  if (!query.trim()) return [];
  const data = await tmdbFetch<{ results: MediaItem[] }>(`/search/${type}`, { query }, 0);
  return data.results ?? [];
}

export async function fetchCatalog(
  type: MediaType,
  catalog: 'popular' | 'top_rated' | 'new'
): Promise<MediaItem[]> {
  const path =
    catalog === 'new'
      ? type === 'movie'
        ? '/movie/now_playing'
        : '/tv/on_the_air'
      : `/${type}/${catalog}`;
  const data = await tmdbFetch<{ results: MediaItem[] }>(path);
  return data.results ?? [];
}

export async function fetchTitleDetails(type: MediaType, id: string | number): Promise<TitleDetails> {
  return tmdbFetch<TitleDetails>(`/${type}/${id}`);
}

export async function fetchSeasonEpisodes(tvId: string | number, seasonNum: number): Promise<Episode[]> {
  const data = await tmdbFetch<{ episodes?: Episode[] }>(`/tv/${tvId}/season/${seasonNum}`);
  return data.episodes ?? [];
}
