'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, Bookmark, Home, LogIn, LogOut, Menu, Search, Settings2, User, X } from 'lucide-react';
import SearchBox from '@/components/layout/SearchBox';
import { createClient, isSupabaseConfigured } from '@/lib/supabase';
import { useContinueWatching } from '@/hooks/useWatchProgress';

const NAV_LINKS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/movies', label: 'Movies' },
  { href: '/tv', label: 'TV Series' },
  { href: '/new', label: 'New & Popular' },
  { href: '/my-list', label: 'My List' },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const continueWatching = useContinueWatching(5);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
    setNotifOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null))
      .catch(() => setEmail(null));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => setEmail(session?.user?.email ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (!profileRef.current?.contains(event.target as Node)) setProfileOpen(false);
      if (!notifRef.current?.contains(event.target as Node)) setNotifOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const initial = email?.[0]?.toUpperCase() ?? null;

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled ? 'bg-[#04120b]/80 backdrop-blur-xl' : 'bg-gradient-to-b from-black/60 to-transparent'
      }`}
    >
      <div className="mx-auto flex h-20 max-w-[1600px] items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-base font-black text-[#04120b]">
            O
          </span>
          <span className="hidden text-sm font-extrabold tracking-tight text-white sm:inline">
            OCCUIN <span className="text-emerald-400">PLAY</span>
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-black/40 p-1.5 backdrop-blur-xl lg:flex">
            {NAV_LINKS.map((link) => {
              const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
                    active
                      ? 'bg-white text-[#04120b]'
                      : 'text-zinc-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {link.label}
                </Link>
              );
            })}

            <span className="mx-1 h-5 w-px bg-white/15" />

            <div ref={notifRef} className="relative">
              <button
                onClick={() => setNotifOpen((v) => !v)}
                aria-label="Notifications"
                className="relative rounded-full p-2 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Bell className="h-4 w-4" />
                {continueWatching.length > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 top-full z-50 mt-3 w-72 rounded-2xl border border-white/10 bg-[#0a1f14]/95 p-2 shadow-2xl backdrop-blur-xl">
                  <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Jump back in
                  </p>
                  {continueWatching.length === 0 ? (
                    <p className="px-2 py-4 text-center text-xs text-zinc-500">Nothing in progress.</p>
                  ) : (
                    continueWatching.map((entry) => (
                      <Link
                        key={`${entry.mediaType}-${entry.tmdbId}-${entry.season}-${entry.episode}`}
                        href={`/watch/${entry.mediaType}/${entry.tmdbId}`}
                        className="block rounded-xl px-2 py-2 transition-colors hover:bg-white/5"
                      >
                        <p className="truncate text-xs font-medium text-zinc-200">
                          {entry.title ?? `#${entry.tmdbId}`}
                        </p>
                        <p className="font-mono text-[10px] text-zinc-500">
                          {entry.mediaType === 'tv' ? `S${entry.season} · E${entry.episode}` : 'Movie'}
                        </p>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>

            <Link
              href="/settings"
              aria-label="Settings"
              className="rounded-full p-2 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              <Settings2 className="h-4 w-4" />
            </Link>
          </div>

          <div className="hidden sm:block">
            <SearchBox />
          </div>

          <div ref={profileRef} className="relative">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              aria-label="Account menu"
              aria-expanded={profileOpen}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-xs font-bold text-zinc-200 backdrop-blur-xl transition-colors hover:border-emerald-400/60"
            >
              {initial ?? <User className="h-4 w-4" />}
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-full z-50 mt-3 w-56 rounded-2xl border border-white/10 bg-[#0a1f14]/95 p-1.5 shadow-2xl backdrop-blur-xl">
                {email && (
                  <p className="truncate border-b border-white/10 px-3 py-2 text-[11px] text-zinc-400">
                    {email}
                  </p>
                )}
                <Link
                  href="/my-list"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-zinc-200 transition-colors hover:bg-white/5"
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  My List
                </Link>
                <Link
                  href="/settings"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-zinc-200 transition-colors hover:bg-white/5"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  Settings
                </Link>
                {isSupabaseConfigured() &&
                  (email ? (
                    <button
                      onClick={async () => {
                        await createClient().auth.signOut();
                        router.refresh();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs text-zinc-200 transition-colors hover:bg-white/5"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out
                    </button>
                  ) : (
                    <Link
                      href="/login"
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-zinc-200 transition-colors hover:bg-white/5"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      Sign in
                    </Link>
                  ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            className="rounded-full border border-white/15 bg-black/40 p-2.5 text-zinc-300 backdrop-blur-xl transition-colors hover:text-white lg:hidden"
          >
            {menuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-white/10 bg-[#04120b]/95 backdrop-blur-xl lg:hidden">
          <div className="space-y-1 px-4 py-3">
            <div className="pb-2 sm:hidden">
              <SearchBox />
            </div>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-xl px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/5 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
