import type { Metadata } from 'next';
import { Clapperboard, Flame, Sparkles, Trophy } from 'lucide-react';
import ConfigNotice from '@/components/ConfigNotice';
import Hero from '@/components/Hero';
import MediaRail from '@/components/MediaRail';
import { typeRails } from '@/lib/catalog';
import ProviderRail from '@/components/ProviderRail';
import { fetchWatchProviders } from '@/lib/tmdb';
import { MOVIE_COLLECTIONS, loadCollections } from '@/lib/collections';

export const revalidate = 3600;
export const metadata: Metadata = { title: 'Movies', alternates: { canonical: '/movies' } };

export default async function MoviesPage() {
  const { trending, popular, topRated, fresh } = await typeRails('movie');
  const providers = await fetchWatchProviders('movie').catch(() => []);
  const collections = await loadCollections(MOVIE_COLLECTIONS);
  if (trending.length === 0 && popular.length === 0) return <ConfigNotice />;

  const heroItems = trending.filter((i) => i.backdrop_path).slice(0, 5);

  return (
    <main className="-mt-20 pb-8">
      <Hero items={heroItems} type="movie" />
      <div className="relative z-10 space-y-10 pt-4">
        <ProviderRail providers={providers} />
        <MediaRail title="Trending Now" items={trending} type="movie" icon={<Flame className="h-4 w-4 text-emerald-400" />} />
        <MediaRail title="Popular Movies" items={popular} type="movie" icon={<Clapperboard className="h-4 w-4 text-emerald-400" />} />
        <MediaRail title="Top Rated" items={topRated} type="movie" icon={<Trophy className="h-4 w-4 text-emerald-400" />} />
        <MediaRail title="Now Playing" items={fresh} type="movie" icon={<Sparkles className="h-4 w-4 text-emerald-400" />} />
        {collections.map(({ rail, items }) => (
          <MediaRail key={rail.key} title={rail.title} items={items} type={rail.type} />
        ))}
      </div>
    </main>
  );
}
