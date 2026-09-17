export interface ThumbnailCue {
  start: number;
  end: number;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

function parseTimestamp(value: string): number {
  const parts = value.trim().split(':').map(Number);
  if (parts.some(Number.isNaN)) return Number.NaN;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] ?? Number.NaN;
}

export function parseThumbnailVtt(vtt: string, baseUrl: string): ThumbnailCue[] {
  const cues: ThumbnailCue[] = [];
  const blocks = vtt.replace(/\r/g, '').split('\n\n');

  for (const block of blocks) {
    const lines = block.split('\n').filter(Boolean);
    const timingLine = lines.find((l) => l.includes('-->'));
    const imageLine = lines[lines.length - 1];
    if (!timingLine || !imageLine || imageLine.includes('-->')) continue;

    const [startRaw, endRaw] = timingLine.split('-->');
    const start = parseTimestamp(startRaw);
    const end = parseTimestamp(endRaw);
    if (Number.isNaN(start) || Number.isNaN(end)) continue;

    const [file, fragment] = imageLine.trim().split('#xywh=');
    let x = 0;
    let y = 0;
    let width = 0;
    let height = 0;

    if (fragment) {
      const [fx, fy, fw, fh] = fragment.split(',').map(Number);
      x = fx || 0;
      y = fy || 0;
      width = fw || 0;
      height = fh || 0;
    }

    let url = file;
    try {
      url = new URL(file, baseUrl).toString();
    } catch {
      url = file;
    }

    cues.push({ start, end, url, x, y, width, height });
  }

  return cues;
}

export function cueAt(cues: ThumbnailCue[], time: number): ThumbnailCue | null {
  if (cues.length === 0) return null;
  let match: ThumbnailCue | null = null;
  for (const cue of cues) {
    if (time >= cue.start && time < cue.end) return cue;
    if (cue.start <= time) match = cue;
  }
  return match;
}
