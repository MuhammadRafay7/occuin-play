import type { Metadata } from 'next';
import { Flame, Sparkles, Trophy, Tv2 } from 'lucide-react';
import ConfigNotice from '@/components/ConfigNotice';
import Hero from '@/components/Hero';
import MediaRail from '@/components/MediaRail';
import { typeRails } from '@/lib/catalog';

export const revalidate = 3600;
export const metadata: Metadata = { title: 'TV Series', alternates: { canonical: '/tv' } };

export default async function TvPage() {
  const { trending, popular, topRated, fresh } = await typeRails('tv');
  if (trending.length === 0 && popular.length === 0) return <ConfigNotice />;

  const heroItems = trending
    .filter((i) => i.backdrop_path)
    .slice(0, 5)
    .map((i) => ({ ...i, media_type: 'tv' as const }));

  return (
    <main className="-mt-16 pb-8">
      <Hero items={heroItems} type="tv" />
      <div className="relative z-10 -mt-12 space-y-10 sm:-mt-16">
        <MediaRail title="Trending Series" items={trending} type="tv" icon={<Flame className="h-4 w-4 text-rose-500" />} />
        <MediaRail title="Popular Series" items={popular} type="tv" icon={<Tv2 className="h-4 w-4 text-rose-500" />} />
        <MediaRail title="Top Rated" items={topRated} type="tv" icon={<Trophy className="h-4 w-4 text-rose-500" />} />
        <MediaRail title="On The Air" items={fresh} type="tv" icon={<Sparkles className="h-4 w-4 text-rose-500" />} />
      </div>
    </main>
  );
}
