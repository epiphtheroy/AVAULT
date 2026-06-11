"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  endpoint: string;
  payload?: Record<string, unknown>;
  label: string;
  busyLabel?: string;
  confirm?: string;
  variant?: "primary" | "danger" | "ghost" | "accent";
  className?: string;
  onDone?: (result: unknown) => void;
}

const styles: Record<NonNullable<Props["variant"]>, string> = {
  primary: "bg-ink text-white hover:bg-ink-soft",
  accent: "bg-accent text-white hover:bg-accent-dark",
  danger: "border border-accent text-accent hover:bg-accent hover:text-white",
  ghost: "border border-rule text-ink-soft hover:border-ink hover:text-ink",
};

export function ActionButton({ endpoint, payload, label, busyLabel, confirm, variant = "primary", className = "", onDone }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    if (confirm && !window.confirm(confirm)) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload ?? {}),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsg(data.error ?? `failed (${res.status})`);
      } else {
        onDone?.(data);
        router.refresh();
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        onClick={run}
        disabled={busy}
        className={`px-3 py-1.5 text-[12px] font-bold transition-colors disabled:opacity-50 ${styles[variant]} ${className}`}
      >
        {busy ? (busyLabel ?? "Working…") : label}
      </button>
      {msg && <span className="text-[11px] text-accent">{msg}</span>}
    </span>
  );
}
