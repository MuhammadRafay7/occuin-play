'use client';

export type SkipInterval = 5 | 10 | 15 | 30;
export type QualityCap = 'auto' | '480' | '720' | '1080';

export interface SubtitleStyle {
  fontSize: number;
  backgroundOpacity: number;
  color: string;
  verticalOffset: number;
}

export interface Preferences {
  autoPlayNext: boolean;
  autoSkipIntro: boolean;
  skipInterval: SkipInterval;
  volume: number;
  muted: boolean;
  playbackRate: number;
  audioBoost: boolean;
  qualityCap: QualityCap;
  bandwidthSaver: boolean;
  prefetchNext: boolean;
  subtitleStyle: SubtitleStyle;
  keybindings: Record<string, string>;
}

export const DEFAULT_KEYBINDINGS: Record<string, string> = {
  playPause: ' ',
  fullscreen: 'f',
  mute: 'm',
  pictureInPicture: 'i',
  seekForward: 'ArrowRight',
  seekBackward: 'ArrowLeft',
  volumeUp: 'ArrowUp',
  volumeDown: 'ArrowDown',
  nextEpisode: 'Shift+N',
  prevEpisode: 'Shift+P',
  frameForward: '.',
  frameBackward: ',',
  speedUp: '>',
  speedDown: '<',
  subtitles: 'c',
  skipIntro: 's',
  help: '?',
};

export const DEFAULT_PREFERENCES: Preferences = {
  autoPlayNext: true,
  autoSkipIntro: false,
  skipInterval: 10,
  volume: 1,
  muted: false,
  playbackRate: 1,
  audioBoost: false,
  qualityCap: 'auto',
  bandwidthSaver: false,
  prefetchNext: true,
  subtitleStyle: {
    fontSize: 100,
    backgroundOpacity: 75,
    color: '#ffffff',
    verticalOffset: 0,
  },
  keybindings: DEFAULT_KEYBINDINGS,
};

const STORAGE_KEY = 'occuin_play_preferences';
export const PREFERENCES_EVENT = 'occuin-play-preferences-update';

export function loadPreferences(): Preferences {
  if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<Preferences>;
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed,
      subtitleStyle: { ...DEFAULT_PREFERENCES.subtitleStyle, ...parsed.subtitleStyle },
      keybindings: { ...DEFAULT_KEYBINDINGS, ...parsed.keybindings },
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(next: Preferences): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(PREFERENCES_EVENT));
  } catch {
    // Storage unavailable; preferences stay in-memory for this session.
  }
}

export function maxHeightForCap(cap: QualityCap, bandwidthSaver: boolean): number {
  if (bandwidthSaver) return 720;
  switch (cap) {
    case '480':
      return 480;
    case '720':
      return 720;
    case '1080':
      return 1080;
    default:
      return Number.POSITIVE_INFINITY;
  }
}
