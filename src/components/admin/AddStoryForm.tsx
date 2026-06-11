"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddStoryForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/stories/add", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setMsg(data.error ?? "failed");
    } else {
      setUrl("");
      setMsg("Added to shortlist.");
      router.refresh();
    }
  }

  return (
    <form onSubmit={submit} className="mt-2 flex gap-2">
      <input
        type="url"
        required
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="https://…"
        className="flex-1 border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
      />
      <button disabled={busy} className="bg-ink px-4 py-2 text-[12px] font-bold text-white hover:bg-accent disabled:opacity-50">
        {busy ? "Fetching…" : "Add"}
      </button>
      {msg && <span className="self-center text-[12px] text-ink-soft">{msg}</span>}
    </form>
  );
}
