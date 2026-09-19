'use client';

import { useEffect } from 'react';
import { RotateCcw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="max-w-md text-sm text-zinc-400">
        The page failed to load. This is often a temporary upstream issue.
      </p>
      <button
        onClick={reset}
        className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-400"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Try again
      </button>
    </main>
  );
}
