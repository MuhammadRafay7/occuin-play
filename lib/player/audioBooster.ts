'use client';

export interface AudioChain {
  enable: () => void;
  disable: () => void;
  destroy: () => void;
}

const chains = new WeakMap<HTMLMediaElement, AudioChain>();

export function getAudioChain(video: HTMLMediaElement): AudioChain | null {
  const existing = chains.get(video);
  if (existing) return existing;

  const AudioContextCtor =
    typeof window !== 'undefined'
      ? window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      : undefined;

  if (!AudioContextCtor) return null;

  let context: AudioContext;
  let source: MediaElementAudioSourceNode;
  try {
    context = new AudioContextCtor();
    source = context.createMediaElementSource(video);
  } catch {
    return null;
  }

  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -50;
  compressor.knee.value = 40;
  compressor.ratio.value = 12;
  compressor.attack.value = 0.003;
  compressor.release.value = 0.25;

  const gain = context.createGain();
  gain.gain.value = 1;

  let enabled = false;

  const routeDirect = () => {
    try {
      source.disconnect();
      compressor.disconnect();
      gain.disconnect();
    } catch {
      // nodes may already be disconnected
    }
    source.connect(context.destination);
  };

  const routeBoosted = () => {
    try {
      source.disconnect();
      gain.disconnect();
    } catch {
      // ignore
    }
    source.connect(compressor);
    compressor.connect(gain);
    gain.connect(context.destination);
  };

  routeDirect();

  const chain: AudioChain = {
    enable() {
      if (enabled) return;
      void context.resume().catch(() => undefined);
      gain.gain.value = 1.8;
      routeBoosted();
      enabled = true;
    },
    disable() {
      if (!enabled) return;
      routeDirect();
      enabled = false;
    },
    destroy() {
      try {
        source.disconnect();
        compressor.disconnect();
        gain.disconnect();
        void context.close();
      } catch {
        // ignore
      }
      chains.delete(video);
    },
  };

  chains.set(video, chain);
  return chain;
}
