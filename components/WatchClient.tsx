'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Keyboard,
  Link2,
  MonitorPlay,
  Settings2,
  Star,
  Undo2,
} from 'lucide-react';
import KeymapModal from '@/components/KeymapModal';
import Player from '@/components/Player';
import SeasonSelector from '@/components/SeasonSelector';
import TimelineComments, { type TimelineComment } from '@/components/TimelineComments';
import VideoPlayer, { type PlayerController } from '@/components/player/VideoPlayer';
import WatchParty from '@/components/WatchParty';
import type { TimelineMarker } from '@/components/player/SeekBar';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { usePreferences } from '@/hooks/usePreferences';
import { useEpisodeProgress, useWatchProgress } from '@/hooks/useWatchProgress';
import { fetchSeasonEpisodes } from '@/lib/tmdb-browser';
import { setWatchedState, type WatchStateTarget } from '@/lib/watchHistory';
import type { Episode, MediaType, TitleDetails } from '@/lib/types';

interface WatchClientProps {
  type: MediaType;
  id: string;
  details: TitleDetails;
  directSrc?: string;
  directSources?: Record<string, string>;
  allowEmbed?: boolean;
}

export default function WatchClient({
  type,
  id,
  details,
  directSrc,
  directSources,
  allowEmbed = true,
}: WatchClientProps) {
  const seasons = useMemo(() => {
    const all = details.seasons ?? [];
    const numbered = all.filter((s) => s.season_number > 0);
    return numbered.length > 0 ? numbered : all;
  }, [details.seasons]);

  const firstSeason = seasons[0]?.season_number ?? 1;

  const [season, setSeason] = useState(firstSeason);
  const [episode, setEpisode] = useState(1);
  const [selectedSeason, setSelectedSeason] = useState(firstSeason);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [playingSeasonEpisodes, setPlayingSeasonEpisodes] = useState<Episode[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(type === 'tv');
  const [episodeError, setEpisodeError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [keymapOpen, setKeymapOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [markers, setMarkers] = useState<TimelineMarker[]>([]);
  const [controller, setController] = useState<PlayerController | null>(null);

  const activeSrc = useMemo(() => {
    if (type === 'movie') return directSrc ?? directSources?.[`movie:${id}`];
    return directSources?.[`tv:${id}:${season}:${episode}`] ?? directSrc;
  }, [type, id, season, episode, directSrc, directSources]);

  const { preferences, update: updatePreferences } = usePreferences();
  const { record } = useWatchProgress();
  const { completed } = useEpisodeProgress(type, id, type === 'tv' ? season : 0, type === 'tv' ? episode : 0);
  const episodesRef = useRef<HTMLDivElement>(null);
  const seasonsRef = useRef(seasons);
  seasonsRef.current = seasons;

  const title = details.title || details.name || 'Untitled';

  useEffect(() => {
    if (type !== 'tv') return;
    const controllerAbort = new AbortController();
    setLoadingEpisodes(true);
    setEpisodeError(null);

    fetchSeasonEpisodes(id, selectedSeason, controllerAbort.signal)
      .then(setEpisodes)
      .catch((error: unknown) => {
        if (controllerAbort.signal.aborted) return;
        setEpisodes([]);
        setEpisodeError(error instanceof Error ? error.message : 'Unknown error');
      })
      .finally(() => {
        if (!controllerAbort.signal.aborted) setLoadingEpisodes(false);
      });

    return () => controllerAbort.abort();
  }, [type, id, selectedSeason]);

  useEffect(() => {
    if (type !== 'tv') return;
    if (selectedSeason === season) {
      setPlayingSeasonEpisodes(episodes);
      return;
    }
    const abort = new AbortController();
    fetchSeasonEpisodes(id, season, abort.signal)
      .then(setPlayingSeasonEpisodes)
      .catch(() => undefined);
    return () => abort.abort();
  }, [type, id, season, selectedSeason, episodes]);

  const maxEpisode = playingSeasonEpisodes.length
    ? Math.max(...playingSeasonEpisodes.map((e) => e.episode_number))
    : 0;

  const seasonNumbers = seasons.map((s) => s.season_number);
  const seasonIndex = seasonNumbers.indexOf(season);
  const hasNextSeason = seasonIndex >= 0 && seasonIndex < seasonNumbers.length - 1;

  const hasNextEpisode = type === 'tv' && (maxEpisode > 0 ? episode < maxEpisode || hasNextSeason : false);
  const hasPrevEpisode = type === 'tv' && (episode > 1 || seasonIndex > 0);

  const goToEpisode = useCallback((nextSeason: number, nextEpisode: number) => {
    setSeason(nextSeason);
    setEpisode(nextEpisode);
    setSelectedSeason(nextSeason);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleNextEpisode = useCallback(() => {
    if (type !== 'tv') return;
    if (maxEpisode > 0 && episode < maxEpisode) {
      goToEpisode(season, episode + 1);
      return;
    }
    if (hasNextSeason) goToEpisode(seasonNumbers[seasonIndex + 1], 1);
  }, [type, maxEpisode, episode, season, hasNextSeason, seasonNumbers, seasonIndex, goToEpisode]);

  const handlePrevEpisode = useCallback(() => {
    if (type !== 'tv') return;
    if (episode > 1) {
      goToEpisode(season, episode - 1);
      return;
    }
    if (seasonIndex > 0) goToEpisode(seasonNumbers[seasonIndex - 1], 1);
  }, [type, episode, season, seasonIndex, seasonNumbers, goToEpisode]);

  const handleMarkWatched = useCallback(() => {
    const activeEpisode = playingSeasonEpisodes.find((e) => e.episode_number === episode);
    const runtimeMinutes = type === 'tv' ? activeEpisode?.runtime : details.runtime;
    const duration = (runtimeMinutes ?? 45) * 60;

    record({
      mediaType: type,
      tmdbId: id,
      season: type === 'tv' ? season : 0,
      episode: type === 'tv' ? episode : 0,
      currentTime: duration,
      duration,
      title,
      posterPath: details.poster_path,
    });
  }, [playingSeasonEpisodes, episode, type, details.runtime, details.poster_path, record, id, season, title]);

  const bulkSetSeason = useCallback(
    (watched: boolean) => {
      const targets: WatchStateTarget[] = episodes.map((ep) => ({
        mediaType: 'tv',
        tmdbId: id,
        season: selectedSeason,
        episode: ep.episode_number,
        runtimeSeconds: (ep.runtime ?? 45) * 60,
        title,
        posterPath: details.poster_path,
      }));
      setWatchedState(targets, watched);
    },
    [episodes, id, selectedSeason, title, details.poster_path]
  );

  const share = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [title]);

  useKeyboardShortcuts(
    preferences.keybindings,
    {
      nextEpisode: () => hasNextEpisode && handleNextEpisode(),
      prevEpisode: () => hasPrevEpisode && handlePrevEpisode(),
      help: () => setKeymapOpen((v) => !v),
    },
    !activeSrc && !keymapOpen
  );

  const handleCommentsLoaded = useCallback((comments: TimelineComment[]) => {
    setMarkers(
      comments.map((comment) => ({
        id: comment.id,
        time: comment.timestamp_sec,
        label: `${comment.author}: ${comment.body}`,
      }))
    );
  }, []);

  const activeEpisodeTitle = playingSeasonEpisodes.find((e) => e.episode_number === episode + 1)?.name;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to catalog
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{title}</h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            {details.vote_average > 0 && (
              <span className="flex items-center gap-1 font-semibold text-yellow-400">
                <Star className="h-3 w-3 fill-yellow-400" />
                {details.vote_average.toFixed(1)}
              </span>
            )}
            {details.genres?.length > 0 && <span>{details.genres.map((g) => g.name).join(' · ')}</span>}
            {type === 'tv' && (
              <span className="font-mono">
                S{season} · E{episode}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => void share()}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:text-white"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Link2 className="h-3.5 w-3.5" />}
            {copied ? 'Copied' : 'Share'}
          </button>
          <button
            onClick={() => setKeymapOpen(true)}
            aria-label="Keyboard shortcuts"
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-300 transition-colors hover:text-white"
          >
            <Keyboard className="h-3.5 w-3.5" />
          </button>
          <Link
            href="/settings"
            aria-label="Settings"
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-300 transition-colors hover:text-white"
          >
            <Settings2 className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {activeSrc ? (
        <VideoPlayer
          src={activeSrc}
          mediaType={type}
          tmdbId={id}
          season={type === 'tv' ? season : 0}
          episode={type === 'tv' ? episode : 0}
          title={title}
          posterPath={details.poster_path}
          poster={
            details.backdrop_path ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}` : undefined
          }
          markers={markers}
          hasNextEpisode={hasNextEpisode}
          hasPrevEpisode={hasPrevEpisode}
          nextEpisodeTitle={activeEpisodeTitle}
          onNextEpisode={handleNextEpisode}
          onPrevEpisode={handlePrevEpisode}
          onControllerReady={setController}
          onTimeChange={setCurrentTime}
          onOpenEpisodes={
            type === 'tv'
              ? () => episodesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              : undefined
          }
        />
      ) : !allowEmbed ? (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-center">
          <MonitorPlay className="h-8 w-8 text-zinc-600" />
          <p className="text-sm font-semibold text-zinc-300">No source available for this title</p>
          <p className="max-w-md text-xs leading-relaxed text-zinc-500">
            Third-party embeds are disabled. Add a direct video source to play this title.
          </p>
        </div>
      ) : (
        <>
          <Player
            tmdbId={id}
            type={type}
            season={season}
            episode={episode}
            completed={completed}
            onMarkWatched={handleMarkWatched}
          />
          <p className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-950/20 p-3 text-[11px] leading-relaxed text-amber-300/90">
            <MonitorPlay className="h-4 w-4 shrink-0" />
            Playing via a third-party embed. Custom controls, subtitles, skip-intro, watch-party sync and
            progress tracking need a direct video source — they activate automatically when one is provided.
          </p>
        </>
      )}

      {details.overview && (
        <p className="max-w-3xl text-sm leading-relaxed text-zinc-400">{details.overview}</p>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <WatchParty controller={activeSrc ? controller : null} />
        <TimelineComments
          mediaType={type}
          tmdbId={id}
          season={type === 'tv' ? season : 0}
          episode={type === 'tv' ? episode : 0}
          currentTime={currentTime}
          onSeek={(time) => controller?.seek(time)}
          onCommentsLoaded={handleCommentsLoaded}
        />
      </div>

      {type === 'tv' && seasons.length > 0 && (
        <div ref={episodesRef} className="scroll-mt-20 space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => bulkSetSeason(true)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:text-white"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark season {selectedSeason} watched
            </button>
            <button
              onClick={() => bulkSetSeason(false)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:text-white"
            >
              <Undo2 className="h-3.5 w-3.5" />
              Mark unwatched
            </button>
          </div>

          <SeasonSelector
            tvId={id}
            seasons={seasons}
            selectedSeason={selectedSeason}
            currentSeason={season}
            currentEpisode={episode}
            episodes={episodes}
            loading={loadingEpisodes}
            error={episodeError}
            onSeasonChange={setSelectedSeason}
            onSelectEpisode={goToEpisode}
          />
        </div>
      )}

      {keymapOpen && (
        <KeymapModal
          preferences={preferences}
          onUpdate={updatePreferences}
          onClose={() => setKeymapOpen(false)}
        />
      )}
    </div>
  );
}
