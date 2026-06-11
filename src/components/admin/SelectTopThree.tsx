"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// One-click "accept top 3" default (spec 4.3): selects the top 3 shortlisted stories
// and kicks off research & draft for each, sequentially.
export function SelectTopThree({ storyIds, disabled }: { storyIds: string[]; disabled: boolean }) {
  const router = useRouter();
  const [progress, setProgress] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      for (let i = 0; i < storyIds.length; i++) {
        setProgress(`Drafting ${i + 1}/${storyIds.length} (1–3 min each)…`);
        const res = await fetch("/api/pipeline/draft", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ storyId: storyIds[i] }),
        });
        if (!res.ok) {
          const data = await res.json();
          setProgress(`Stopped at ${i + 1}: ${data.error ?? res.status}`);
          setBusy(false);
          router.refresh();
          return;
        }
        router.refresh();
      }
      setProgress("All three drafted. Review them in the Pipeline board.");
    } finally {
      setBusy(false);
      router.refresh();
    }
  }

  if (!storyIds.length) return null;
  return (
    <div className="mt-3 flex items-center gap-3">
      <button
        onClick={run}
        disabled={disabled || busy}
        className="bg-accent px-4 py-2 text-[12px] font-bold text-white hover:bg-accent-dark disabled:opacity-40"
      >
        {busy ? "Working…" : "Accept top 3 → draft all"}
      </button>
      {progress && <span className="text-[12px] text-ink-soft">{progress}</span>}
    </div>
  );
}
