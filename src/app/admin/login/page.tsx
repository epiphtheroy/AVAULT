"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Wordmark } from "@/components/site/Wordmark";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const supabase = supabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    window.location.assign("/admin"); // full navigation so middleware sees the fresh session cookie
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-warm px-4">
      <div className="w-full max-w-sm">
        <div className="bg-accent p-5 text-white">
          <Wordmark className="h-6" />
          <p className="mt-1 text-[10px] font-semibold tracking-[0.18em] uppercase text-white/85">
            Studio entrance
          </p>
        </div>
        <form onSubmit={submit} className="border border-rule border-t-0 bg-paper p-5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border border-rule px-3 py-2 text-sm outline-none focus:border-ink"
              autoComplete="username"
              required
            />
          </label>
          <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full border border-rule px-3 py-2 text-sm outline-none focus:border-ink"
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className="mt-3 text-sm text-accent">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="mt-5 w-full bg-ink py-2.5 text-sm font-bold text-white hover:bg-accent transition-colors disabled:opacity-50"
          >
            {busy ? "Opening…" : "Open the vault"}
          </button>
        </form>
      </div>
    </div>
  );
}
