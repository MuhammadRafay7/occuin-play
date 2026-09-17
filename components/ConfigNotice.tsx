import { AlertTriangle } from 'lucide-react';

export default function ConfigNotice() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-24 text-center sm:px-6">
      <AlertTriangle className="mx-auto mb-4 h-8 w-8 text-amber-400" />
      <h2 className="text-lg font-bold text-white">Catalog unavailable</h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        No titles came back from TMDB. Set <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs">TMDB_API_KEY</code>{' '}
        in your environment and restart the server.
      </p>
    </div>
  );
}
