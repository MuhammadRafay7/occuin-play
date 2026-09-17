const prefetched = new Set<string>();

export function prefetchSource(url: string, bytes = 1_500_000): void {
  if (!url || prefetched.has(url) || typeof window === 'undefined') return;
  prefetched.add(url);

  try {
    void fetch(url, {
      headers: { Range: `bytes=0-${bytes}` },
      mode: 'cors',
      cache: 'force-cache',
      priority: 'low',
    } as RequestInit).catch(() => undefined);
  } catch {
    // Prefetch is opportunistic.
  }
}
