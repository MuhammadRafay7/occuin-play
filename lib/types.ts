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

export interface CastMember {
  id: number;
  name: string;
  character?: string;
  profile_path: string | null;
  order?: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job?: string;
  department?: string;
}

export interface VideoClip {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official?: boolean;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
}

export interface TitleDetails {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  backdrop_path: string | null;
  poster_path: string | null;
  vote_average: number;
  vote_count?: number;
  runtime?: number | null;
  episode_run_time?: number[];
  release_date?: string;
  first_air_date?: string;
  status?: string;
  tagline?: string;
  budget?: number;
  revenue?: number;
  original_language?: string;
  genres: { id: number; name: string }[];
  production_companies?: ProductionCompany[];
  belongs_to_collection?: { id: number; name: string; poster_path: string | null } | null;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: Season[];
  credits?: { cast?: CastMember[]; crew?: CrewMember[] };
  videos?: { results?: VideoClip[] };
  recommendations?: { results?: MediaItem[] };
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
