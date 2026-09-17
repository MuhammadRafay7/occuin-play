import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="font-mono text-xs uppercase tracking-widest text-rose-500">404</p>
      <h1 className="text-2xl font-bold">Title not found</h1>
      <p className="max-w-md text-sm text-zinc-400">
        We couldn&apos;t find what you were looking for.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-rose-500"
      >
        Back to catalog
      </Link>
    </main>
  );
}
