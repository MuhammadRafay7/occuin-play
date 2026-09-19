import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import ConfigNotice from '@/components/ConfigNotice';
import MediaCard from '@/components/MediaCard';
import { safeCatalog } from '@/lib/catalog';
import { fetchCatalog, fetchTrending } from '@/lib/tmdb';
import type { MediaItem, MediaType } from '@/lib/types';

export const revalidate = 3600;

const CATEGORIES: Record<string, string> = {
  trending: 'Trending',
  popular: 'Popular',
  top_rated: 'Top Rated',
  new: 'New Releases',
};

interface PageProps {
  params: Promise<{ type: string; name: string }>;
}

function parseType(value: string): MediaType | null {
  return value === 'movie' || value === 'tv' ? value : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type, name } = await params;
  const label = CATEGORIES[name];
  return { title: label ? `${label} ${type === 'tv' ? 'Series' : 'Movies'}` : 'Browse' };
}

export default async function CategoryPage({ params }: PageProps) {
  const { type, name } = await params;
  const mediaType = parseType(type);
  const label = CATEGORIES[name];
  if (!mediaType || !label) notFound();

  const items: MediaItem[] =
    name === 'trending'
      ? await safeCatalog(() => fetchTrending(mediaType))
      : await safeCatalog(() => fetchCatalog(mediaType, name as 'popular' | 'top_rated' | 'new'));

  if (items.length === 0) return <ConfigNotice />;

  return (
    <main className="mx-auto max-w-[1600px] space-y-8 px-4 py-10 sm:px-6">
      <header>
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          {label} {mediaType === 'tv' ? 'Series' : 'Movies'}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">{items.length} titles</p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7">
        {items.map((item) => (
          <MediaCard key={item.id} item={item} type={mediaType} />
        ))}
      </div>
    </main>
  );
}
