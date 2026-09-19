import { Clapperboard, Flame, Sparkles, Tv2 } from 'lucide-react';
import ConfigNotice from '@/components/ConfigNotice';
import ContinueWatchingRail from '@/components/ContinueWatchingRail';
import Hero from '@/components/Hero';
import ProviderRail from '@/components/ProviderRail';
import MediaRail from '@/components/MediaRail';
import { homeRails } from '@/lib/catalog';
import { fetchWatchProviders } from '@/lib/tmdb';
import { MOVIE_COLLECTIONS, TV_COLLECTIONS, loadCollections } from '@/lib/collections';

export const revalidate = 3600;

export default async function HomePage() {
  const { trendingMovies, trendingTv, popularMovies, topTv, newMovies } = await homeRails();
  const providers = await fetchWatchProviders('movie').catch(() => []);
  const collections = await loadCollections([...MOVIE_COLLECTIONS, ...TV_COLLECTIONS]);

  const heroItems = trendingMovies
    .filter((item) => item.backdrop_path)
    .slice(0, 5)
    .map((item) => ({ ...item, media_type: 'movie' as const }));

  const nothingLoaded =
    trendingMovies.length === 0 && trendingTv.length === 0 && popularMovies.length === 0;

  if (nothingLoaded) return <ConfigNotice />;

  return (
    <main className="-mt-20 pb-8">
      <Hero items={heroItems} type="movie" />

      <div className="relative z-10 space-y-10 pt-4">
        <ProviderRail providers={providers} />

        <ContinueWatchingRail />

        <MediaRail
          title="Trending Now"
          items={trendingMovies}
          type="movie"
          icon={<Flame className="h-4 w-4 text-emerald-400" />}
        />
        <MediaRail
          title="Popular Movies"
          items={popularMovies}
          type="movie"
          icon={<Clapperboard className="h-4 w-4 text-emerald-400" />}
        />
        <MediaRail
          title="Top TV Series"
          items={topTv}
          type="tv"
          icon={<Tv2 className="h-4 w-4 text-emerald-400" />}
        />
        <MediaRail
          title="Trending Series"
          items={trendingTv}
          type="tv"
          icon={<Flame className="h-4 w-4 text-emerald-400" />}
        />
        <MediaRail
          title="New Releases"
          items={newMovies}
          type="movie"
          icon={<Sparkles className="h-4 w-4 text-emerald-400" />}
        />
        {collections.map(({ rail, items }) => (
          <MediaRail key={rail.key} title={rail.title} items={items} type={rail.type} />
        ))}
      </div>
    </main>
  );
}
