'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FastForward, Loader2, Play, RotateCcw } from 'lucide-react';
import AutoPlayNextModal from '@/components/AutoPlayNextModal';
import ControlBar from '@/components/player/ControlBar';
import SettingsMenu, { type TrackOption } from '@/components/player/SettingsMenu';
import KeymapModal from '@/components/KeymapModal';
import type { TimelineMarker } from '@/components/player/SeekBar';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { usePreferences } from '@/hooks/usePreferences';
import { useWatchProgress } from '@/hooks/useWatchProgress';
import { getAudioChain } from '@/lib/player/audioBooster';
import { activeSkipRange, defaultOutroRange, type SkipRange } from '@/lib/player/chapters';
import { prefetchSource } from '@/lib/player/prefetch';
import { parseThumbnailVtt, type ThumbnailCue } from '@/lib/player/thumbnails';
import { maxHeightForCap } from '@/lib/preferences';
import { getWatchProgress } from '@/lib/watchHistory';
import type { MediaType } from '@/lib/types';

const SAVE_INTERVAL_SEC = 3;
const AUTOPLAY_LEAD_SEC = 10;
const FRAME = 1 / 24;

interface QualityLevel {
  id: number;
  label: string;
  active: boolean;
}

export interface VideoPlayerProps {
  src: string;
  poster?: string;
  mediaType: MediaType;
  tmdbId: string;
  season?: number;
  episode?: number;
  title?: string;
  posterPath?: string | null;
  thumbnailVttUrl?: string;
  skipRanges?: SkipRange[];
  markers?: TimelineMarker[];
  hasNextEpisode?: boolean;
  hasPrevEpisode?: boolean;
  nextEpisodeTitle?: string;
  nextEpisodeSrc?: string;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
  onControllerReady?: (controller: PlayerController) => void;
  onTimeChange?: (time: number) => void;
  onOpenEpisodes?: () => void;
}

export interface PlayerController {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
  getTime: () => number;
  isPlaying: () => boolean;
}

export default function VideoPlayer({
  src,
  poster,
  mediaType,
  tmdbId,
  season = 0,
  episode = 0,
  title,
  posterPath,
  thumbnailVttUrl,
  skipRanges = [],
  markers = [],
  hasNextEpisode = false,
  hasPrevEpisode = false,
  nextEpisodeTitle,
  nextEpisodeSrc,
  onNextEpisode,
  onPrevEpisode,
  onControllerReady,
  onTimeChange,
  onOpenEpisodes,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<{ destroy: () => void; currentLevel: number; levels: { height: number }[] } | null>(null);
  const lastSavedRef = useRef(0);
  const prefetchedRef = useRef(false);

  const { preferences, update } = usePreferences();
  const { record } = useWatchProgress();

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [waiting, setWaiting] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [keymapOpen, setKeymapOpen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [audioTracks, setAudioTracks] = useState<TrackOption[]>([]);
  const [textTracks, setTextTracks] = useState<TrackOption[]>([]);
  const [cueText, setCueText] = useState('');
  const [thumbnails, setThumbnails] = useState<ThumbnailCue[]>([]);
  const [savedTime, setSavedTime] = useState(0);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [showAutoPlay, setShowAutoPlay] = useState(false);
  const [countdown, setCountdown] = useState(AUTOPLAY_LEAD_SEC);
  const [autoPlayCanceled, setAutoPlayCanceled] = useState(false);

  const allSkipRanges = useMemo(() => {
    const outro = hasNextEpisode ? defaultOutroRange(duration) : null;
    return outro ? [...skipRanges, outro] : skipRanges;
  }, [skipRanges, duration, hasNextEpisode]);

  const activeSkip = activeSkipRange(allSkipRanges, currentTime);

  const persist = useCallback(
    (time: number, total: number) => {
      if (!total || Number.isNaN(total)) return;
      record({ mediaType, tmdbId, season, episode, currentTime: time, duration: total, title, posterPath });
    },
    [record, mediaType, tmdbId, season, episode, title, posterPath]
  );

  useEffect(() => {
    const progress = getWatchProgress(mediaType, tmdbId, season, episode);
    const resumable = progress && progress.currentTime > 5 && progress.currentTime < progress.duration - 10;
    setSavedTime(resumable ? progress.currentTime : 0);
    setShowResumePrompt(Boolean(resumable));
    setShowAutoPlay(false);
    setAutoPlayCanceled(false);
    setCountdown(AUTOPLAY_LEAD_SEC);
    lastSavedRef.current = 0;
    prefetchedRef.current = false;
  }, [mediaType, tmdbId, season, episode]);

  useEffect(() => {
    if (!thumbnailVttUrl) {
      setThumbnails([]);
      return;
    }
    let canceled = false;
    fetch(thumbnailVttUrl)
      .then((res) => (res.ok ? res.text() : Promise.reject(new Error('vtt'))))
      .then((text) => {
        if (!canceled) setThumbnails(parseThumbnailVtt(text, thumbnailVttUrl));
      })
      .catch(() => {
        if (!canceled) setThumbnails([]);
      });
    return () => {
      canceled = true;
    };
  }, [thumbnailVttUrl]);

  const syncTracks = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const audio = (video as HTMLVideoElement & { audioTracks?: AudioTrackList }).audioTracks;
    if (audio) {
      setAudioTracks(
        Array.from({ length: audio.length }, (_, i) => ({
          id: i,
          label: audio[i].label || audio[i].language || `Track ${i + 1}`,
          active: audio[i].enabled,
        }))
      );
    }

    setTextTracks(
      Array.from(video.textTracks)
        .map((track, i) => ({
          id: i,
          label: track.label || track.language || `Subtitle ${i + 1}`,
          active: track.mode === 'hidden' && track === activeTextTrackRef.current,
          kind: track.kind,
        }))
        .filter((t) => t.kind === 'subtitles' || t.kind === 'captions')
        .map(({ id, label, active }) => ({ id, label, active }))
    );
  }, []);

  const activeTextTrackRef = useRef<TextTrack | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    hlsRef.current?.destroy();
    hlsRef.current = null;
    setQualityLevels([]);

    const isHls = src.includes('.m3u8');
    if (!isHls) {
      video.src = src;
      return;
    }

    let destroyed = false;
    import('hls.js').then(({ default: Hls }) => {
      if (destroyed) return;
      if (!Hls.isSupported()) {
        video.src = src;
        return;
      }
      const hls = new Hls({ enableWorker: true, capLevelToPlayerSize: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setQualityLevels([
          { id: -1, label: 'Auto', active: hls.currentLevel === -1 },
          ...hls.levels.map((level, i) => ({
            id: i,
            label: `${level.height}p`,
            active: hls.currentLevel === i,
          })),
        ]);
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => {
        setQualityLevels((prev) => prev.map((l) => ({ ...l, active: l.id === data.level })));
      });
      hlsRef.current = hls as unknown as typeof hlsRef.current;
    });

    return () => {
      destroyed = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src]);

  useEffect(() => {
    const hls = hlsRef.current as unknown as { autoLevelCapping: number; levels: { height: number }[] } | null;
    if (!hls?.levels) return;
    const cap = maxHeightForCap(preferences.qualityCap, preferences.bandwidthSaver);
    if (!Number.isFinite(cap)) {
      hls.autoLevelCapping = -1;
      return;
    }
    const allowed = hls.levels.map((l, i) => ({ i, h: l.height })).filter((l) => l.h <= cap);
    hls.autoLevelCapping = allowed.length ? allowed[allowed.length - 1].i : -1;
  }, [preferences.qualityCap, preferences.bandwidthSaver, qualityLevels]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = preferences.volume;
    video.muted = preferences.muted;
    video.playbackRate = preferences.playbackRate;
  }, [preferences.volume, preferences.muted, preferences.playbackRate]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const chain = getAudioChain(video);
    if (!chain) return;
    if (preferences.audioBoost) chain.enable();
    else chain.disable();
  }, [preferences.audioBoost]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  useEffect(() => {
    if (!showAutoPlay) return;
    if (countdown <= 0) {
      setShowAutoPlay(false);
      onNextEpisode?.();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [showAutoPlay, countdown, onNextEpisode]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const flush = () => {
      if (video.duration) persist(video.currentTime, video.duration);
    };
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', flush);
      flush();
    };
  }, [persist]);

  const seekTo = useCallback((time: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(time)) return;
    video.currentTime = Math.min(Math.max(time, 0), video.duration || time);
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) void video.play().catch(() => undefined);
    else video.pause();
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void containerRef.current?.requestFullscreen().catch(() => undefined);
  }, []);

  const togglePip = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (document.pictureInPictureElement) void document.exitPictureInPicture().catch(() => undefined);
    else void video.requestPictureInPicture?.().catch(() => undefined);
  }, []);

  const stepFrame = useCallback((direction: 1 | -1) => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = Math.max(video.currentTime + direction * FRAME, 0);
  }, []);

  const selectText = useCallback(
    (id: number) => {
      const video = videoRef.current;
      if (!video) return;
      const tracks = Array.from(video.textTracks);
      tracks.forEach((track, i) => {
        track.mode = i === id ? 'hidden' : 'disabled';
      });
      activeTextTrackRef.current = id >= 0 ? tracks[id] ?? null : null;
      if (id < 0) setCueText('');
      syncTracks();
    },
    [syncTracks]
  );

  const handleSkip = useCallback(() => {
    if (activeSkip) seekTo(activeSkip.end);
  }, [activeSkip, seekTo]);

  useEffect(() => {
    if (!preferences.autoSkipIntro || !activeSkip || activeSkip.kind === 'outro') return;
    seekTo(activeSkip.end);
  }, [preferences.autoSkipIntro, activeSkip, seekTo]);

  useKeyboardShortcuts(
    preferences.keybindings,
    {
      playPause: togglePlay,
      fullscreen: toggleFullscreen,
      pictureInPicture: togglePip,
      mute: () => update({ muted: !preferences.muted }),
      seekForward: () => seekTo(currentTime + preferences.skipInterval),
      seekBackward: () => seekTo(currentTime - preferences.skipInterval),
      volumeUp: () => update({ volume: Math.min(preferences.volume + 0.1, 1), muted: false }),
      volumeDown: () => update({ volume: Math.max(preferences.volume - 0.1, 0) }),
      nextEpisode: () => hasNextEpisode && onNextEpisode?.(),
      prevEpisode: () => hasPrevEpisode && onPrevEpisode?.(),
      frameForward: () => stepFrame(1),
      frameBackward: () => stepFrame(-1),
      speedUp: () => update({ playbackRate: Math.min(preferences.playbackRate + 0.25, 2) }),
      speedDown: () => update({ playbackRate: Math.max(preferences.playbackRate - 0.25, 0.25) }),
      subtitles: () => selectText(textTracks.some((t) => t.active) ? -1 : 0),
      skipIntro: handleSkip,
      help: () => setKeymapOpen((v) => !v),
    },
    !keymapOpen
  );

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    const { currentTime: time, duration: total } = video;
    setCurrentTime(time);
    onTimeChange?.(time);

    if (video.buffered.length > 0) {
      setBuffered(video.buffered.end(video.buffered.length - 1));
    }

    if (!total || Number.isNaN(total)) return;

    if (Math.abs(time - lastSavedRef.current) >= SAVE_INTERVAL_SEC) {
      persist(time, total);
      lastSavedRef.current = time;
    }

    if (preferences.prefetchNext && nextEpisodeSrc && !prefetchedRef.current && total - time <= 120) {
      prefetchedRef.current = true;
      prefetchSource(nextEpisodeSrc);
    }

    if (!hasNextEpisode || !preferences.autoPlayNext || autoPlayCanceled || showAutoPlay) return;

    const remaining = total - time;
    if (remaining <= AUTOPLAY_LEAD_SEC && remaining > 0) {
      setCountdown(Math.max(Math.ceil(remaining), 1));
      setShowAutoPlay(true);
    }
  };

  const renderCues = useCallback(() => {
    const track = activeTextTrackRef.current;
    if (!track?.activeCues?.length) {
      setCueText('');
      return;
    }
    const text = Array.from(track.activeCues)
      .map((cue) => (cue as VTTCue).text ?? '')
      .join('\n');
    setCueText(text);
  }, []);

  useEffect(() => {
    const track = activeTextTrackRef.current;
    if (!track) return;
    track.addEventListener('cuechange', renderCues);
    return () => track.removeEventListener('cuechange', renderCues);
  }, [renderCues, textTracks]);

  useEffect(() => {
    if (!onControllerReady) return;
    onControllerReady({
      play: () => void videoRef.current?.play().catch(() => undefined),
      pause: () => videoRef.current?.pause(),
      seek: (time: number) => seekTo(time),
      getTime: () => videoRef.current?.currentTime ?? 0,
      isPlaying: () => !(videoRef.current?.paused ?? true),
    });
  }, [onControllerReady, seekTo]);

  const { subtitleStyle } = preferences;

  return (
    <div
      ref={containerRef}
      className="group relative aspect-video w-full overflow-hidden rounded-2xl border border-zinc-800 bg-black shadow-2xl"
      onMouseMove={() => setControlsVisible(true)}
      onMouseLeave={() => playing && setControlsVisible(false)}
    >
      <video
        ref={videoRef}
        poster={poster}
        playsInline
        crossOrigin="anonymous"
        className="h-full w-full object-contain"
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onLoadedMetadata={() => {
          const video = videoRef.current;
          if (!video) return;
          setDuration(video.duration);
          syncTracks();
          if (!showResumePrompt && savedTime > 0) video.currentTime = savedTime;
        }}
        onTimeUpdate={handleTimeUpdate}
        onDurationChange={() => setDuration(videoRef.current?.duration ?? 0)}
        onPlay={() => setPlaying(true)}
        onPause={() => {
          setPlaying(false);
          const video = videoRef.current;
          if (video?.duration) persist(video.currentTime, video.duration);
        }}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onEnded={() => {
          setPlaying(false);
          const video = videoRef.current;
          if (video?.duration) persist(video.duration, video.duration);
          if (hasNextEpisode && preferences.autoPlayNext && !autoPlayCanceled) onNextEpisode?.();
        }}
        onVolumeChange={() => {
          const video = videoRef.current;
          if (!video) return;
          if (video.volume !== preferences.volume || video.muted !== preferences.muted) {
            update({ volume: video.volume, muted: video.muted });
          }
        }}
      />

      {cueText && (
        <div
          className="pointer-events-none absolute inset-x-0 z-10 flex justify-center px-8 text-center"
          style={{ bottom: `${96 + subtitleStyle.verticalOffset}px` }}
        >
          <span
            className="whitespace-pre-line rounded px-2 py-1 font-semibold leading-snug"
            style={{
              fontSize: `${subtitleStyle.fontSize / 100}rem`,
              color: subtitleStyle.color,
              backgroundColor: `rgba(0,0,0,${subtitleStyle.backgroundOpacity / 100})`,
            }}
          >
            {cueText}
          </span>
        </div>
      )}

      {waiting && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-white/80" />
        </div>
      )}

      {activeSkip && !showResumePrompt && (
        <button
          onClick={handleSkip}
          className="absolute bottom-24 right-6 z-30 flex items-center gap-2 rounded-xl border border-white/20 bg-black/80 px-4 py-2.5 text-xs font-semibold text-white backdrop-blur-md transition-colors hover:bg-black"
        >
          <FastForward className="h-4 w-4" />
          {activeSkip.label}
        </button>
      )}

      {showResumePrompt && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/80 p-6 text-center backdrop-blur-md">
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-emerald-400">Continue watching</p>
          <h3 className="mb-6 text-lg font-bold text-white">
            Resume from {new Date(savedTime * 1000).toISOString().substring(11, 19)}?
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                seekTo(savedTime);
                void videoRef.current?.play().catch(() => undefined);
                setShowResumePrompt(false);
              }}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-400"
            >
              <Play className="h-4 w-4 fill-white" />
              Resume
            </button>
            <button
              onClick={() => {
                seekTo(0);
                void videoRef.current?.play().catch(() => undefined);
                setShowResumePrompt(false);
              }}
              className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-200 transition-colors hover:bg-zinc-700"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Start over
            </button>
          </div>
        </div>
      )}

      {showAutoPlay && hasNextEpisode && (
        <AutoPlayNextModal
          nextEpisodeNumber={episode + 1}
          nextEpisodeTitle={nextEpisodeTitle}
          countdown={countdown}
          maxSeconds={AUTOPLAY_LEAD_SEC}
          onPlayNow={() => {
            setShowAutoPlay(false);
            onNextEpisode?.();
          }}
          onCancel={() => {
            setShowAutoPlay(false);
            setAutoPlayCanceled(true);
          }}
        />
      )}

      {settingsOpen && (
        <SettingsMenu
          preferences={preferences}
          audioTracks={audioTracks}
          textTracks={textTracks}
          qualityLevels={qualityLevels}
          onUpdate={update}
          onSelectAudio={(id) => {
            const video = videoRef.current as (HTMLVideoElement & { audioTracks?: AudioTrackList }) | null;
            if (!video?.audioTracks) return;
            Array.from({ length: video.audioTracks.length }).forEach((_, i) => {
              video.audioTracks![i].enabled = i === id;
            });
            syncTracks();
          }}
          onSelectText={selectText}
          onSelectQuality={(id) => {
            const hls = hlsRef.current;
            if (hls) hls.currentLevel = id;
          }}
        />
      )}

      <div
        className={`transition-opacity duration-200 ${
          controlsVisible || !playing || settingsOpen ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <ControlBar
          playing={playing}
          currentTime={currentTime}
          duration={duration}
          buffered={buffered}
          volume={preferences.volume}
          muted={preferences.muted}
          fullscreen={fullscreen}
          skipInterval={preferences.skipInterval}
          thumbnails={thumbnails}
          skipRanges={allSkipRanges}
          markers={markers}
          settingsOpen={settingsOpen}
          canStepFrames
          hasPrev={hasPrevEpisode}
          hasNext={hasNextEpisode}
          onTogglePlay={togglePlay}
          onSeek={seekTo}
          onNudge={(delta) => seekTo(currentTime + delta)}
          onStepFrame={stepFrame}
          onVolume={(value) => update({ volume: value, muted: value === 0 })}
          onToggleMute={() => update({ muted: !preferences.muted })}
          onToggleFullscreen={toggleFullscreen}
          onTogglePip={togglePip}
          onToggleSettings={() => setSettingsOpen((v) => !v)}
          onPrevEpisode={() => onPrevEpisode?.()}
          onNextEpisode={() => onNextEpisode?.()}
          onOpenEpisodes={onOpenEpisodes}
        />
      </div>

      {keymapOpen && (
        <KeymapModal preferences={preferences} onUpdate={update} onClose={() => setKeymapOpen(false)} />
      )}
    </div>
  );
}
