import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Layers } from 'lucide-react';
import type { TitleDetails } from '@/lib/types';

interface InfoPanelProps {
  details: TitleDetails;
}

function money(value?: number): string | null {
  if (!value || value <= 0) return null;
  return `$${value.toLocaleString('en-US')}`;
}

function runtimeLabel(details: TitleDetails): string | null {
  const minutes = details.runtime ?? details.episode_run_time?.[0];
  if (!minutes || minutes <= 0) return null;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDate(value?: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function InfoPanel({ details }: InfoPanelProps) {
  const rows: { label: string; value: string }[] = [];

  const runtime = runtimeLabel(details);
  if (runtime) rows.push({ label: 'Runtime', value: runtime });
  if (details.original_language)
    rows.push({ label: 'Language', value: details.original_language.toUpperCase() });

  const released = formatDate(details.release_date ?? details.first_air_date);
  if (released) rows.push({ label: 'Release Date', value: released });
  if (details.status) rows.push({ label: 'Status', value: details.status });

  const budget = money(details.budget);
  if (budget) rows.push({ label: 'Budget', value: budget });
  const revenue = money(details.revenue);
  if (revenue) rows.push({ label: 'Revenue', value: revenue });

  if (details.number_of_seasons)
    rows.push({ label: 'Seasons', value: String(details.number_of_seasons) });
  if (details.number_of_episodes)
    rows.push({ label: 'Episodes', value: String(details.number_of_episodes) });

  const collection = details.belongs_to_collection;
  const companies = (details.production_companies ?? []).filter((c) => c.logo_path).slice(0, 3);

  if (rows.length === 0 && !collection && companies.length === 0) return null;

  return (
    <div className="w-full space-y-4 lg:w-[340px]">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-4 border-b border-white/5 px-4 py-3 last:border-b-0"
          >
            <span className="text-xs text-zinc-400">{row.label}</span>
            <span className="text-right text-xs font-semibold text-zinc-100">{row.value}</span>
          </div>
        ))}

        {collection && (
          <Link
            href={`/movies?collection=${collection.id}`}
            className="flex items-center justify-between gap-3 border-t border-white/5 px-4 py-3 transition-colors hover:bg-white/5"
          >
            <span className="flex items-center gap-2 text-xs font-medium text-zinc-100">
              <Layers className="h-3.5 w-3.5 text-emerald-400" />
              {collection.name}
            </span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
          </Link>
        )}
      </div>

      {companies.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 px-1 opacity-60">
          {companies.map((company) => (
            <div key={company.id} className="relative h-7 w-24">
              <Image
                src={`https://image.tmdb.org/t/p/w154${company.logo_path}`}
                alt={company.name}
                fill
                sizes="96px"
                className="object-contain object-left brightness-0 invert"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
