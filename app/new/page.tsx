import type { Metadata } from 'next';
import { Flame, Sparkles, Tv2 } from 'lucide-react';
import ConfigNotice from '@/components/ConfigNotice';
import MediaRail from '@/components/MediaRail';
import { fetchCatalog, fetchTrending } from '@/lib/tmdb';
import { safeCatalog } from '@/lib/catalog';

export const revalidate = 3600;
export const metadata: Metadata = { title: 'New & Popular', alternates: { canonical: '/new' } };

export default async function NewPage() {
  const [newMovies, onAir, trendingMovies, trendingTv, popularMovies] = await Promise.all([
    safeCatalog(() => fetchCatalog('movie', 'new')),
    safeCatalog(() => fetchCatalog('tv', 'new')),
    safeCatalog(() => fetchTrending('movie')),
    safeCatalog(() => fetchTrending('tv')),
    safeCatalog(() => fetchCatalog('movie', 'popular')),
  ]);

  if (newMovies.length === 0 && onAir.length === 0 && trendingMovies.length === 0) {
    return <ConfigNotice />;
  }

  return (
    <main className="space-y-10 py-8">
      <header className="px-4 sm:px-6">
        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">New &amp; Popular</h1>
        <p className="mt-1 text-xs text-zinc-400">Fresh releases and what everyone is watching right now.</p>
      </header>

      <MediaRail title="New Movies" items={newMovies} type="movie" icon={<Sparkles className="h-4 w-4 text-rose-500" />} />
      <MediaRail title="New Episodes" items={onAir} type="tv" icon={<Tv2 className="h-4 w-4 text-rose-500" />} />
      <MediaRail title="Trending Movies" items={trendingMovies} type="movie" icon={<Flame className="h-4 w-4 text-rose-500" />} />
      <MediaRail title="Trending Series" items={trendingTv} type="tv" icon={<Flame className="h-4 w-4 text-rose-500" />} />
      <MediaRail title="Popular Movies" items={popularMovies} type="movie" icon={<Flame className="h-4 w-4 text-rose-500" />} />
    </main>
  );
}
