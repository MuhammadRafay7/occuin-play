import Image from 'next/image';
import Link from 'next/link';
import { Layers } from 'lucide-react';
import type { WatchProvider } from '@/lib/tmdb';

interface ProviderRailProps {
  providers: WatchProvider[];
}

export default function ProviderRail({ providers }: ProviderRailProps) {
  if (providers.length === 0) return null;

  return (
    <section className="mx-auto max-w-[1600px] px-4 sm:px-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-bold tracking-tight text-white">
        <Layers className="h-4 w-4 text-emerald-400" />
        Browse by Provider
      </h2>

      <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {providers.map((provider) => (
          <Link
            key={provider.provider_id}
            href={`/provider/${provider.provider_id}`}
            title={provider.provider_name}
            className="group relative h-16 w-24 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all hover:border-emerald-400/50 hover:bg-white/10"
          >
            <Image
              src={`https://image.tmdb.org/t/p/w154${provider.logo_path}`}
              alt={provider.provider_name}
              fill
              sizes="96px"
              className="object-contain p-2.5 transition-transform group-hover:scale-105"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
