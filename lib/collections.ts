import 'server-only';
import { fetchDiscover } from '@/lib/tmdb';
import { safeCatalog } from '@/lib/catalog';
import type { MediaItem, MediaType } from '@/lib/types';

export interface CuratedRail {
  key: string;
  title: string;
  type: MediaType;
  params: Record<string, string>;
}

export const MOVIE_COLLECTIONS: CuratedRail[] = [
  { key: 'acclaimed', title: 'Award Winning Movies', type: 'movie', params: { sort_by: 'vote_average.desc', 'vote_count.gte': '3000' } },
  { key: 'thrillers', title: 'Psychological Thrillers', type: 'movie', params: { with_genres: '53,9648' } },
  { key: 'true-story', title: 'Based on a True Story', type: 'movie', params: { with_keywords: '9672' } },
  { key: 'scifi', title: 'Sci-Fi & Fantasy', type: 'movie', params: { with_genres: '878,14' } },
  { key: 'horror', title: 'Horror Picks', type: 'movie', params: { with_genres: '27' } },
  { key: 'family', title: 'Family Night', type: 'movie', params: { with_genres: '10751' } },
  { key: 'docs', title: 'Documentaries', type: 'movie', params: { with_genres: '99' } },
];

export const TV_COLLECTIONS: CuratedRail[] = [
  { key: 'tv-acclaimed', title: 'Award Winning Shows', type: 'tv', params: { sort_by: 'vote_average.desc', 'vote_count.gte': '1000' } },
  { key: 'tv-crime', title: 'Crime & Mystery', type: 'tv', params: { with_genres: '80,9648' } },
  { key: 'tv-scifi', title: 'Sci-Fi & Fantasy Series', type: 'tv', params: { with_genres: '10765' } },
  { key: 'tv-docs', title: 'Documentary Series', type: 'tv', params: { with_genres: '99' } },
  { key: 'tv-animation', title: 'Animation', type: 'tv', params: { with_genres: '16' } },
];

export async function loadCollections(
  rails: CuratedRail[]
): Promise<{ rail: CuratedRail; items: MediaItem[] }[]> {
  const loaded = await Promise.all(
    rails.map(async (rail) => ({
      rail,
      items: await safeCatalog(() => fetchDiscover(rail.type, rail.params)),
    }))
  );
  return loaded.filter((entry) => entry.items.length > 0);
}
