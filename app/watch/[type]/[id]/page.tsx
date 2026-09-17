import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import WatchClient from '@/components/WatchClient';
import { fetchTitleDetails } from '@/lib/tmdb';
import { TmdbError, titleOf, type MediaType } from '@/lib/types';

interface PageProps {
  params: Promise<{ type: string; id: string }>;
}

function parseType(value: string): MediaType | null {
  return value === 'movie' || value === 'tv' ? value : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type, id } = await params;
  const mediaType = parseType(type);
  if (!mediaType) return { title: 'Not found' };

  try {
    const details = await fetchTitleDetails(mediaType, id);
    return {
      title: `${titleOf(details)} — Occuin Play`,
      description: details.overview?.slice(0, 160),
    };
  } catch {
    return { title: 'Occuin Play' };
  }
}

export default async function WatchPage({ params }: PageProps) {
  const { type, id } = await params;
  const mediaType = parseType(type);
  if (!mediaType || !/^\d+$/.test(id)) notFound();

  let details;
  try {
    details = await fetchTitleDetails(mediaType, id);
  } catch (error) {
    if (error instanceof TmdbError && error.status === 404) notFound();
    throw error;
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl p-4 sm:p-8">
      <WatchClient type={mediaType} id={id} details={details} />
    </main>
  );
}
