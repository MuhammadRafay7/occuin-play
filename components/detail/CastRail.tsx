import Image from 'next/image';
import { User } from 'lucide-react';
import type { CastMember } from '@/lib/types';

interface CastRailProps {
  cast: CastMember[];
}

export default function CastRail({ cast }: CastRailProps) {
  const people = cast.slice(0, 20);
  if (people.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-bold tracking-tight text-white">Cast</h2>

      <div className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {people.map((person) => (
          <div key={person.id} className="w-[110px] shrink-0">
            <div className="relative mb-2 aspect-square w-full overflow-hidden rounded-full border border-white/10 bg-[#0a1f14]">
              {person.profile_path ? (
                <Image
                  src={`https://image.tmdb.org/t/p/w185${person.profile_path}`}
                  alt={person.name}
                  fill
                  sizes="110px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-600">
                  <User className="h-7 w-7" />
                </div>
              )}
            </div>
            <p className="truncate text-center text-xs font-semibold text-zinc-100">{person.name}</p>
            {person.character && (
              <p className="truncate text-center text-[11px] text-zinc-500">{person.character}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
