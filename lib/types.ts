export type MediaType = 'movie' | 'tv';

export interface MediaItem {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  media_type?: MediaType;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
}

export interface Episode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  runtime: number | null;
  vote_average: number;
}

export interface Season {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  poster_path: string | null;
  air_date: string;
}

export interface TitleDetails {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  backdrop_path: string | null;
  poster_path: string | null;
  vote_average: number;
  runtime?: number | null;
  release_date?: string;
  first_air_date?: string;
  genres: { id: number; name: string }[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: Season[];
}

export class TmdbError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'TmdbError';
  }
}

export function titleOf(item: { title?: string; name?: string }): string {
  return item.title || item.name || 'Untitled';
}

export function yearOf(item: { release_date?: string; first_air_date?: string }): string {
  const date = item.release_date || item.first_air_date;
  if (!date) return 'N/A';
  const year = new Date(date).getFullYear();
  return Number.isNaN(year) ? 'N/A' : String(year);
}
