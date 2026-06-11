import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import type { Article } from "@/lib/types";

export const dynamic = "force-dynamic";

// Analytics (spec 6.5) — Phase 3 skeleton: live DB counters + Reopening queue now;
// GSC impressions/clicks integration lands in Phase 3 (GOOGLE_SEARCH_CONSOLE_* env).
export default async function AnalyticsPage() {
  const db = await supabaseServer();

  const [publishedRes, weekRes, flaggedRes, eventsRes] = await Promise.all([
    db.from("articles").select("id", { count: "exact", head: true }).not("published_at", "is", null),
    db.from("articles").select("*").not("published_at", "is", null)
      .gte("published_at", new Date(Date.now() - 7 * 86400_000).toISOString()),
    db.from("articles").select("*").eq("flagged_for_reopening", true).order("published_at", { ascending: false }),
    db.from("events").select("*").order("created_at", { ascending: false }).limit(25),
  ]);

  const weekArticles = (weekRes.data ?? []) as Article[];
  const flagged = (flaggedRes.data ?? []) as Article[];
  const events = eventsRes.data ?? [];

  const interventionMix = weekArticles.reduce<Record<string, number>>((acc, a) => {
    const k = a.intervention_type ?? "—";
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-4xl">
      <div className="border-b-2 border-rule-dark pb-2">
        <h1 className="font-sans text-sm font-bold uppercase tracking-[0.14em]">Analytics</h1>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="bar-top bg-paper p-4">
          <p className="text-3xl font-bold">{publishedRes.count ?? 0}</p>
          <p className="text-[12px] text-ink-soft">verdicts in The Vault</p>
        </div>
        <div className="bar-top bg-paper p-4">
          <p className="text-3xl font-bold">{weekArticles.length}</p>
          <p className="text-[12px] text-ink-soft">published this week (target 21)</p>
        </div>
        <div className="bar-top bg-paper p-4">
          <p className="text-3xl font-bold">{flagged.length}</p>
          <p className="text-[12px] text-ink-soft">flagged for The Reopening</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">Intervention mix (7 days)</h2>
          <div className="mt-2 space-y-1.5">
            {Object.entries(interventionMix).map(([k, v]) => (
              <p key={k} className="flex justify-between border-b border-rule pb-1 text-[13px]">
                <span>{k}</span><b>{v}</b>
              </p>
            ))}
            {weekArticles.length === 0 && <p className="text-[13px] text-ink-faint">No publications this week yet.</p>}
          </div>

          <h2 className="mt-6 text-[11px] font-bold uppercase tracking-wider text-ink-soft">Search Console</h2>
          <p className="mt-2 border border-dashed border-rule p-4 text-[13px] text-ink-faint">
            Phase 3: impressions, clicks, and top queries per article appear here once the
            Google Search Console API is connected and the site is verified in GSC.
          </p>
        </section>

        <section>
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">Reopening queue</h2>
          <div className="mt-2 space-y-2">
            {flagged.map((a) => (
              <Link key={a.id} href={`/admin/editor/${a.id}`} className="block border border-rule bg-paper p-2.5 text-[13px] hover:border-ink">
                <span className="font-semibold">{a.headline}</span>
                <span className="mt-0.5 block text-[11px] text-ink-faint">
                  published {a.published_at ? new Date(a.published_at).toLocaleDateString() : "—"}
                </span>
              </Link>
            ))}
            {flagged.length === 0 && (
              <p className="text-[13px] text-ink-faint">
                Nothing flagged. Flag any published column for re-examination from its editor page.
              </p>
            )}
          </div>

          <h2 className="mt-6 text-[11px] font-bold uppercase tracking-wider text-ink-soft">Audit log (latest 25)</h2>
          <div className="mt-2 max-h-80 space-y-1 overflow-y-auto text-[11px] text-ink-soft">
            {events.map((e) => (
              <p key={e.id} className="border-b border-rule pb-1">
                <b>{e.entity_type}</b> {e.from_status ? `${e.from_status} → ` : ""}{e.to_status ?? ""} · {e.actor} · {new Date(e.created_at).toLocaleString()}
              </p>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
