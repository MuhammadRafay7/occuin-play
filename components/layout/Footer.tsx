import Link from 'next/link';
import { Globe, Mail, Rss } from 'lucide-react';

const QUICK_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/movies', label: 'Movies' },
  { href: '/tv', label: 'TV Series' },
  { href: '/new', label: 'New & Popular' },
  { href: '/my-list', label: 'My List' },
  { href: '/settings', label: 'Settings' },
];

function XMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  );
}

function InstagramMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

const SOCIALS = [
  { href: 'https://x.com', label: 'X', Icon: XMark },
  { href: 'https://instagram.com', label: 'Instagram', Icon: InstagramMark },
  { href: 'https://occuinplay.occuin.com', label: 'Website', Icon: Globe },
  { href: '/feed.xml', label: 'Updates', Icon: Rss },
  { href: 'mailto:hello@occuin.com', label: 'Contact', Icon: Mail },
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-zinc-800/80 bg-[#09090b]">
      <div className="mx-auto max-w-[1600px] px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-sm space-y-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-600 text-xs font-black text-white">
                O
              </span>
              <span className="text-sm font-extrabold tracking-tight text-white">
                OCCUIN <span className="text-rose-500">PLAY</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-zinc-500">
              Metadata and artwork provided by TMDB. Occuin Play does not host, upload, or store any video
              content — playback is provided by third-party sources.
            </p>
          </div>

          <nav aria-label="Footer" className="grid grid-cols-2 gap-x-10 gap-y-2 sm:grid-cols-3">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-zinc-400 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-zinc-800/80 pt-6 sm:flex-row">
          <p className="text-[11px] text-zinc-600">
            © {new Date().getFullYear()} Occuin Play. All rights reserved.
          </p>

          <div className="flex items-center gap-2">
            {SOCIALS.map(({ href, label, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="rounded-lg border border-zinc-800 p-2 text-zinc-400 transition-colors hover:border-rose-600/50 hover:text-white"
              >
                <Icon className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
