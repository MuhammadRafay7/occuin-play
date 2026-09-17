import { Clapperboard, Flame, Sparkles, Tv2 } from 'lucide-react';
import ConfigNotice from '@/components/ConfigNotice';
import ContinueWatchingRail from '@/components/ContinueWatchingRail';
import Hero from '@/components/Hero';
import MediaRail from '@/components/MediaRail';
import { homeRails } from '@/lib/catalog';

export const revalidate = 3600;

export default async function HomePage() {
  const { trendingMovies, trendingTv, popularMovies, topTv, newMovies } = await homeRails();

  const heroItems = trendingMovies
    .filter((item) => item.backdrop_path)
    .slice(0, 5)
    .map((item) => ({ ...item, media_type: 'movie' as const }));

  const nothingLoaded =
    trendingMovies.length === 0 && trendingTv.length === 0 && popularMovies.length === 0;

  if (nothingLoaded) return <ConfigNotice />;

  return (
    <main className="-mt-16 pb-8">
      <Hero items={heroItems} type="movie" />

      <div className="relative z-10 -mt-12 space-y-10 sm:-mt-16">
        <ContinueWatchingRail />

        <MediaRail
          title="Trending Now"
          items={trendingMovies}
          type="movie"
          icon={<Flame className="h-4 w-4 text-rose-500" />}
        />
        <MediaRail
          title="Popular Movies"
          items={popularMovies}
          type="movie"
          icon={<Clapperboard className="h-4 w-4 text-rose-500" />}
        />
        <MediaRail
          title="Top TV Series"
          items={topTv}
          type="tv"
          icon={<Tv2 className="h-4 w-4 text-rose-500" />}
        />
        <MediaRail
          title="Trending Series"
          items={trendingTv}
          type="tv"
          icon={<Flame className="h-4 w-4 text-rose-500" />}
        />
        <MediaRail
          title="New Releases"
          items={newMovies}
          type="movie"
          icon={<Sparkles className="h-4 w-4 text-rose-500" />}
        />
      </div>
    </main>
  );
}
