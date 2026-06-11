"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Article, DigestEntry, GateReport, SourceRef, Story } from "@/lib/types";

interface Version {
  id: string;
  headline: string | null;
  deck: string | null;
  summary_line: string | null;
  body_md: string | null;
  note: string | null;
  created_at: string;
}

interface Props {
  article: Article;
  story: Story | null;
  versions: Version[];
  digest: DigestEntry[];
  sources: SourceRef[];
}

type Pane = "gate" | "sources" | "versions" | "digest";

export function EditorClient({ article, story, versions, digest, sources }: Props) {
  const router = useRouter();
  const [headline, setHeadline] = useState(article.headline ?? "");
  const [deck, setDeck] = useState(article.deck ?? "");
  const [summaryLine, setSummaryLine] = useState(article.summary_line ?? "");
  const [body, setBody] = useState(article.body_md ?? "");
  const [notes, setNotes] = useState("");
  const [pane, setPane] = useState<Pane>("gate");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const gate = article.gate_report_json as GateReport | null;
  const dirty =
    headline !== (article.headline ?? "") || deck !== (article.deck ?? "") ||
    summaryLine !== (article.summary_line ?? "") || body !== (article.body_md ?? "");

  async function call(endpoint: string, payload: Record<string, unknown>, label: string) {
    setBusy(label);
    setMsg(null);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) setMsg(data.error ?? `failed (${res.status})`);
      else router.refresh();
      return res.ok ? data : null;
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "network error");
      return null;
    } finally {
      setBusy(null);
    }
  }

  const saveEdits = () =>
    call("/api/pipeline/status", {
      entity: "article", id: article.id, action: "edit",
      fields: { headline, deck, summary_line: summaryLine, body_md: body },
    }, "save");

  const runGate = async () => {
    if (dirty) await saveEdits();
    await call("/api/pipeline/gate", { articleId: article.id }, "gate");
  };

  const regenerate = () =>
    call("/api/pipeline/draft", {
      articleId: article.id,
      feedback: notes || gate?.checks.filter((c) => !c.pass) || "editor requested regeneration",
    }, "regen");

  const publish = async (mode: "now" | "queue") => {
    if (dirty) await saveEdits();
    const data = await call("/api/pipeline/publish", { articleId: article.id, mode }, mode);
    if (data) setMsg(mode === "now" ? `Published: ${data.url}` : `Queued for ${new Date(data.scheduled_for).toLocaleString()}`);
  };

  const failedChecks = gate?.checks.filter((c) => !c.pass) ?? [];
  const isPublished = !!article.published_at;
  const canRegen = article.regen_count < 2 && !isPublished;

  return (
    <div>
      {/* Status strip */}
      <div className="bar-top flex flex-wrap items-center justify-between gap-2 bg-paper p-3">
        <div className="flex items-center gap-3 text-[12px]">
          <span className="bg-ink px-2 py-0.5 font-bold text-white">{article.status}</span>
          <span className="text-ink-faint">slot {article.slot_date ?? "—"} · regen {article.regen_count}/2</span>
          {gate && (
            <span className={gate.pass ? "font-bold text-green-700" : "font-bold text-accent"}>
              gate: {gate.pass ? "PASS" : `FAIL (${failedChecks.length})`}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={saveEdits} disabled={!dirty || !!busy}
            className="border border-rule px-3 py-1.5 text-[12px] font-bold text-ink-soft hover:border-ink disabled:opacity-40">
            {busy === "save" ? "Saving…" : dirty ? "Save edits" : "Saved"}
          </button>
          <button onClick={runGate} disabled={!!busy || !body}
            className="bg-ink px-3 py-1.5 text-[12px] font-bold text-white hover:bg-ink-soft disabled:opacity-40">
            {busy === "gate" ? "Gating…" : "Run gate"}
          </button>
          {canRegen && (
            <button onClick={regenerate} disabled={!!busy}
              className="border border-accent px-3 py-1.5 text-[12px] font-bold text-accent hover:bg-accent hover:text-white disabled:opacity-40">
              {busy === "regen" ? "Regenerating (1–3 min)…" : "Regenerate"}
            </button>
          )}
          {!isPublished && (
            <>
              <button onClick={() => publish("queue")} disabled={!!busy || !body}
                className="border border-ink px-3 py-1.5 text-[12px] font-bold hover:bg-ink hover:text-white disabled:opacity-40">
                {busy === "queue" ? "Queueing…" : "Approve → 6 a.m. ET"}
              </button>
              <button onClick={() => publish("now")} disabled={!!busy || !body}
                className="bg-accent px-3 py-1.5 text-[12px] font-bold text-white hover:bg-accent-dark disabled:opacity-40">
                {busy === "now" ? "Publishing…" : "Approve & publish now"}
              </button>
            </>
          )}
          {isPublished && article.url_slug && (
            <a href={`/article/${article.url_slug}`} target="_blank"
              className="border border-ink px-3 py-1.5 text-[12px] font-bold hover:bg-ink hover:text-white">
              View live →
            </a>
          )}
          {isPublished && (
            <button
              onClick={() => call("/api/pipeline/status", { entity: "article", id: article.id, action: "flag_reopening" }, "flag")}
              disabled={!!busy}
              className="border border-rule px-3 py-1.5 text-[12px] font-bold text-ink-soft hover:border-ink disabled:opacity-40">
              {busy === "flag" ? "…" : article.flagged_for_reopening ? "Unflag reopening" : "Flag for Reopening"}
            </button>
          )}
        </div>
      </div>
      {msg && <p className="mt-2 text-[13px] font-semibold text-accent">{msg}</p>}
      {article.regen_count >= 2 && !gate?.pass && !isPublished && (
        <p className="mt-2 border border-accent bg-paper p-2 text-[12px] text-accent">
          Two regenerations used. Spec 5.4: manual edit required from here.
        </p>
      )}

      <div className="mt-4 grid gap-5 lg:grid-cols-[1fr_360px]">
        {/* Draft pane */}
        <div className="space-y-3">
          {story && (
            <p className="text-[12px] text-ink-faint">
              Source: <a className="underline hover:text-accent" href={story.url} target="_blank" rel="noopener">{story.outlet} — {story.headline}</a>
              {story.byline ? ` · by ${story.byline}` : ""}
            </p>
          )}
          <input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Headline"
            className="hed w-full border border-rule bg-paper px-3 py-2 text-xl outline-none focus:border-ink" />
          <input value={deck} onChange={(e) => setDeck(e.target.value)} placeholder="Deck (one sentence)"
            className="w-full border border-rule bg-paper px-3 py-2 font-serif text-[15px] outline-none focus:border-ink" />
          <textarea value={summaryLine} onChange={(e) => setSummaryLine(e.target.value)} placeholder="One-line summary (bolded on site)"
            rows={2} className="w-full border border-rule bg-paper px-3 py-2 font-serif text-[15px] font-bold outline-none focus:border-ink" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body (Markdown). Drafts appear here after generation."
            rows={28} className="w-full border border-rule bg-paper px-3 py-2 font-serif text-[15px] leading-relaxed outline-none focus:border-ink" />
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">Editor notes for regeneration</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
              placeholder="Optional: what should change? Injected into the regeneration call."
              className="mt-1 w-full border border-rule bg-paper px-3 py-2 text-[13px] outline-none focus:border-ink" />
          </div>
        </div>

        {/* Side panes */}
        <div>
          <div className="flex border-b-2 border-rule-dark text-[12px] font-bold">
            {(["gate", "sources", "versions", "digest"] as Pane[]).map((p) => (
              <button key={p} onClick={() => setPane(p)}
                className={`px-3 py-1.5 uppercase tracking-wider ${pane === p ? "bg-ink text-white" : "text-ink-soft hover:text-ink"}`}>
                {p}
              </button>
            ))}
          </div>

          {pane === "gate" && (
            <div className="mt-3 space-y-2">
              {!gate && <p className="text-[13px] text-ink-faint">No gate report yet. Run the gate after drafting.</p>}
              {gate?.checks.map((c) => (
                <div key={c.name} className={`border p-2.5 ${c.pass ? "border-rule" : "border-accent bg-paper"}`}>
                  <p className="flex items-center justify-between text-[12px] font-bold">
                    <span>{c.name}</span>
                    <span className={c.pass ? "text-green-700" : "text-accent"}>{c.pass ? "PASS" : "FAIL"}</span>
                  </p>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-soft">{c.evidence}</p>
                </div>
              ))}
            </div>
          )}

          {pane === "sources" && (
            <div className="mt-3 space-y-2">
              {sources.length === 0 && <p className="text-[13px] text-ink-faint">No sources logged yet.</p>}
              {sources.map((s, i) => (
                <p key={i} className="border border-rule p-2.5 text-[12px] leading-snug">
                  <a href={s.url} target="_blank" rel="noopener" className="font-semibold hover:text-accent">{s.title}</a>
                  <span className="text-ink-faint"> — {s.outlet}</span>
                </p>
              ))}
            </div>
          )}

          {pane === "versions" && (
            <div className="mt-3 space-y-2">
              {versions.map((v) => (
                <div key={v.id} className="border border-rule p-2.5 text-[12px]">
                  <p className="flex justify-between font-semibold">
                    <span>{v.note ?? "version"}</span>
                    <span className="text-ink-faint">{new Date(v.created_at).toLocaleString()}</span>
                  </p>
                  <p className="mt-1 line-clamp-2 text-ink-soft">{v.headline}</p>
                  <button
                    onClick={() => {
                      setHeadline(v.headline ?? ""); setDeck(v.deck ?? "");
                      setSummaryLine(v.summary_line ?? ""); setBody(v.body_md ?? "");
                    }}
                    className="mt-1.5 text-[11px] font-bold text-accent hover:underline">
                    Restore into editor
                  </button>
                </div>
              ))}
            </div>
          )}

          {pane === "digest" && (
            <div className="mt-3 space-y-2">
              <p className="text-[11px] text-ink-faint">
                What the model was told about recent columns (anti-repetition, spec 4.2):
              </p>
              {digest.length === 0 && <p className="text-[13px] text-ink-faint">No published columns yet.</p>}
              {digest.map((d, i) => (
                <div key={i} className="border border-rule p-2.5 text-[12px]">
                  <p className="font-semibold">{d.headline}</p>
                  <p className="mt-1 text-ink-soft">theorists: {(d.theorists_json ?? []).join(", ") || "none"} · intervention: {d.intervention_type ?? "—"}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
