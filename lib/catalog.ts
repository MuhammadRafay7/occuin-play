import 'server-only';
import { fetchCatalog, fetchTrending } from '@/lib/tmdb';
import type { MediaItem, MediaType } from '@/lib/types';

export async function safeCatalog(loader: () => Promise<MediaItem[]>): Promise<MediaItem[]> {
  try {
    return await loader();
  } catch {
    return [];
  }
}

export async function homeRails() {
  const [trendingMovies, trendingTv, popularMovies, topTv, newMovies] = await Promise.all([
    safeCatalog(() => fetchTrending('movie')),
    safeCatalog(() => fetchTrending('tv')),
    safeCatalog(() => fetchCatalog('movie', 'popular')),
    safeCatalog(() => fetchCatalog('tv', 'top_rated')),
    safeCatalog(() => fetchCatalog('movie', 'new')),
  ]);

  return { trendingMovies, trendingTv, popularMovies, topTv, newMovies };
}

export async function typeRails(type: MediaType) {
  const [trending, popular, topRated, fresh] = await Promise.all([
    safeCatalog(() => fetchTrending(type)),
    safeCatalog(() => fetchCatalog(type, 'popular')),
    safeCatalog(() => fetchCatalog(type, 'top_rated')),
    safeCatalog(() => fetchCatalog(type, 'new')),
  ]);

  return { trending, popular, topRated, fresh };
}
