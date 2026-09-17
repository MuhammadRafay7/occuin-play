'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [error, setError] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;

    setStatus('sending');
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (signInError) {
      setError(signInError.message);
      setStatus('idle');
      return;
    }
    setStatus('sent');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to catalog
      </Link>

      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold tracking-tight">Sign in</h1>
        <p className="text-sm text-zinc-400">
          Sync your watch history across devices. We&apos;ll email you a sign-in link.
        </p>
      </div>

      {!configured ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-xs text-amber-300">
          Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
          to enable sign-in.
        </p>
      ) : status === 'sent' ? (
        <p className="rounded-xl border border-emerald-500/30 bg-emerald-950/30 p-4 text-sm text-emerald-300">
          Check <span className="font-semibold">{email}</span> for your sign-in link.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-white transition-all placeholder:text-zinc-500 focus:border-rose-600 focus:outline-none focus:ring-1 focus:ring-rose-600"
          />
          <button
            type="submit"
            disabled={status === 'sending'}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-3 text-xs font-semibold text-white transition-colors hover:bg-rose-500 disabled:opacity-60"
          >
            {status === 'sending' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Send sign-in link
          </button>
          {error && <p className="text-xs text-rose-400">{error}</p>}
        </form>
      )}
    </main>
  );
}
