import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — Movies & TV`,
    template: `%s — ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  manifest: '/manifest.webmanifest',
  applicationName: SITE_NAME,
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: 'black-translucent' },
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: `${SITE_NAME} — Movies & TV`,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — Movies & TV`,
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: '#04120b',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="flex min-h-screen flex-col bg-[#04120b] font-sans text-zinc-50">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
