import { Play } from 'lucide-react';
import type { VideoClip } from '@/lib/types';

interface TrailerRailProps {
  videos: VideoClip[];
}

export default function TrailerRail({ videos }: TrailerRailProps) {
  const clips = videos.filter((v) => v.site === 'YouTube').slice(0, 8);
  if (clips.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold tracking-tight text-white">Trailers</h2>

      <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {clips.map((clip) => (
          <a
            key={clip.id}
            href={`https://www.youtube.com/watch?v=${clip.key}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group w-[260px] shrink-0"
          >
            <div className="relative mb-2 aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-[#0a1f14]">
              <img
                src={`https://i.ytimg.com/vi/${clip.key}/hqdefault.jpg`}
                alt={clip.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white">
                  <Play className="h-4 w-4 fill-[#04120b] text-[#04120b]" />
                </span>
              </span>
            </div>
            <p className="line-clamp-2 text-xs font-medium text-zinc-200">{clip.name}</p>
            <p className="text-[11px] uppercase tracking-wide text-zinc-500">{clip.type}</p>
          </a>
        ))}
      </div>
    </section>
  );
}
