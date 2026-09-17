import { NextRequest, NextResponse } from 'next/server';
import {
  fetchCatalog,
  fetchSeasonEpisodes,
  fetchTitleDetails,
  fetchTrending,
  searchCatalog,
} from '@/lib/tmdb';
import { TmdbError, type MediaType } from '@/lib/types';

function parseType(value: string | null): MediaType {
  return value === 'tv' ? 'tv' : 'movie';
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'trending':
        return NextResponse.json({ results: await fetchTrending(parseType(searchParams.get('type'))) });

      case 'catalog': {
        const catalog = searchParams.get('catalog');
        if (catalog !== 'popular' && catalog !== 'top_rated' && catalog !== 'new') {
          return NextResponse.json({ error: 'Unknown catalog' }, { status: 400 });
        }
        return NextResponse.json({
          results: await fetchCatalog(parseType(searchParams.get('type')), catalog),
        });
      }

      case 'search':
        return NextResponse.json({
          results: await searchCatalog(searchParams.get('query') ?? '', parseType(searchParams.get('type'))),
        });

      case 'details': {
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
        return NextResponse.json(await fetchTitleDetails(parseType(searchParams.get('type')), id));
      }

      case 'season': {
        const tvId = searchParams.get('tvId');
        const season = Number(searchParams.get('season'));
        if (!tvId || !Number.isFinite(season)) {
          return NextResponse.json({ error: 'Missing tvId or season' }, { status: 400 });
        }
        return NextResponse.json({ episodes: await fetchSeasonEpisodes(tvId, season) });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    const status = error instanceof TmdbError ? error.status : 500;
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ error: message }, { status });
  }
}
