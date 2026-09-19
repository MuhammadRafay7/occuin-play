import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Clapperboard, Tv2 } from 'lucide-react';
import ConfigNotice from '@/components/ConfigNotice';
import MediaRail from '@/components/MediaRail';
import { safeCatalog } from '@/lib/catalog';
import { fetchDiscover, fetchWatchProviders } from '@/lib/tmdb';

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const providers = await fetchWatchProviders('movie').catch(() => []);
  const provider = providers.find((p) => String(p.provider_id) === id);
  return { title: provider ? `${provider.provider_name}` : 'Provider' };
}

export default async function ProviderPage({ params }: PageProps) {
  const { id } = await params;
  if (!/^\d+$/.test(id)) notFound();

  const [providers, movies, shows] = await Promise.all([
    fetchWatchProviders('movie').catch(() => []),
    safeCatalog(() =>
      fetchDiscover('movie', { with_watch_providers: id, watch_region: 'PK', 'vote_count.gte': '50' })
    ),
    safeCatalog(() =>
      fetchDiscover('tv', { with_watch_providers: id, watch_region: 'PK', 'vote_count.gte': '20' })
    ),
  ]);

  const provider = providers.find((p) => String(p.provider_id) === id);
  if (movies.length === 0 && shows.length === 0) return <ConfigNotice />;

  return (
    <main className="space-y-10 py-10">
      <header className="mx-auto max-w-[1600px] px-4 sm:px-6">
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
          {provider?.provider_name ?? 'Provider'}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">Movies and series available on this service.</p>
      </header>

      <MediaRail
        title={`Movies on ${provider?.provider_name ?? 'this service'}`}
        items={movies}
        type="movie"
        icon={<Clapperboard className="h-4 w-4 text-emerald-400" />}
      />
      <MediaRail
        title={`TV Series on ${provider?.provider_name ?? 'this service'}`}
        items={shows}
        type="tv"
        icon={<Tv2 className="h-4 w-4 text-emerald-400" />}
      />
    </main>
  );
}
