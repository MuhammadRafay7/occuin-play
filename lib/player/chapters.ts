export interface SkipRange {
  kind: 'intro' | 'recap' | 'outro';
  start: number;
  end: number;
  label: string;
}

export function activeSkipRange(ranges: SkipRange[], time: number): SkipRange | null {
  return ranges.find((range) => time >= range.start && time < range.end) ?? null;
}

export function defaultOutroRange(duration: number): SkipRange | null {
  if (!duration || duration < 300) return null;
  const start = Math.max(duration - 45, 0);
  return { kind: 'outro', start, end: duration, label: 'Skip outro' };
}
