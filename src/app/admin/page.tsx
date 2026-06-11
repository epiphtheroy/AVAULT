import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { PIPELINE_ORDER, type Article, type Story, type PipelineStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STORY_STATES: PipelineStatus[] = ["DETECTED", "SHORTLISTED", "SELECTED"];

function ageIn(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h`;
  return `${Math.floor(mins / 1440)}d`;
}

function nextOpeningET(): string {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 10, 0, 0));
  if (next <= now) next.setUTCDate(next.getUTCDate() + 1);
  const h = Math.floor((next.getTime() - now.getTime()) / 3600000);
  const m = Math.floor(((next.getTime() - now.getTime()) % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default async function PipelineBoard() {
  const db = await supabaseServer();
  const today = new Date().toISOString().slice(0, 10);

  const [storiesRes, articlesRes, sentRes, suppressionRes, publishedRes] = await Promise.all([
    db.from("stories").select("*").in("status", ["DETECTED", "SHORTLISTED", "SELECTED"]).order("detected_at", { ascending: false }).limit(120),
    db.from("articles").select("*").not("status", "in", "(REJECTED,KILLED)").order("updated_at", { ascending: false }).limit(60),
    db.from("outreach_emails").select("id, status, sent_at").gte("sent_at", new Date(Date.now() - 7 * 86400_000).toISOString()),
    db.from("suppression_list").select("id", { count: "exact", head: true }),
    db.from("articles").select("id", { count: "exact", head: true }).not("published_at", "is", null),
  ]);

  const stories = (storiesRes.data ?? []) as Story[];
  const articles = (articlesRes.data ?? []) as Article[];
  const todaySlots = articles.filter((a) => a.slot_date === today);
  const publishedTotal = publishedRes.count ?? 0;
  const sentThisWeek = (sentRes.data ?? []).length;
  const repliedThisWeek = (sentRes.data ?? []).filter((e) => e.status === "REPLIED").length;

  const columns: { state: PipelineStatus; items: { id: string; title: string; sub: string; href: string; gate?: boolean | null; age: string }[] }[] =
    PIPELINE_ORDER.map((state) => ({
      state,
      items: [
        ...(STORY_STATES.includes(state)
          ? stories
              .filter((s) => s.status === state)
              .map((s) => ({
                id: s.id,
                title: s.headline,
                sub: s.outlet,
                href: "/admin/desk",
                gate: null,
                age: ageIn(s.detected_at),
              }))
          : []),
        ...articles
          .filter((a) => a.status === state)
          .map((a) => ({
            id: a.id,
            title: a.headline ?? "(researching…)",
            sub: a.slot_date ?? "",
            href: `/admin/editor/${a.id}`,
            gate: a.gate_report_json ? a.gate_report_json.pass : null,
            age: ageIn(a.updated_at),
          })),
      ],
    })).filter((c) => c.items.length > 0 || ["DETECTED", "SHORTLISTED", "IN_REVIEW", "PUBLISHED"].includes(c.state));

  return (
    <div>
      {/* Today panel */}
      <section className="bar-top bg-paper p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="font-sans text-sm font-bold uppercase tracking-[0.14em]">Today — {today}</h1>
          <p className="text-xs text-ink-faint">Next opening (6:00 a.m. ET) in {nextOpeningET()}</p>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => {
            const slot = todaySlots[i];
            return slot ? (
              <Link key={i} href={`/admin/editor/${slot.id}`} className="border border-rule bg-paper-warm p-3 hover:border-ink">
                <p className="kicker">Slot {i + 1} · {slot.status}</p>
                <p className="hed mt-1 text-[15px] leading-snug">{slot.headline ?? "(drafting…)"}</p>
              </Link>
            ) : (
              <Link key={i} href="/admin/desk" className="border border-dashed border-rule p-3 text-center text-xs text-ink-faint hover:border-ink hover:text-ink">
                Slot {i + 1} — select a story →
              </Link>
            );
          })}
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 border-t border-rule pt-2.5 text-[12px] text-ink-soft">
          <span><b className="text-ink">{publishedTotal}</b> published (The Vault)</span>
          <span><b className="text-ink">{sentThisWeek}</b> emails sent this week</span>
          <span><b className="text-ink">{repliedThisWeek}</b> replies this week</span>
          <span><b className="text-ink">{suppressionRes.count ?? 0}</b> suppressed</span>
        </div>
      </section>

      {/* Kanban */}
      <section className="mt-5 overflow-x-auto pb-4">
        <div className="flex gap-3" style={{ minWidth: columns.length * 248 }}>
          {columns.map((col) => (
            <div key={col.state} className="w-60 shrink-0">
              <div className="border-b-2 border-rule-dark pb-1.5 flex items-baseline justify-between">
                <h2 className="text-[11px] font-bold tracking-wider">{col.state.replaceAll("_", " ")}</h2>
                <span className="text-[11px] text-ink-faint">{col.items.length}</span>
              </div>
              <div className="mt-2 space-y-2">
                {col.items.slice(0, 12).map((item) => (
                  <Link key={item.id} href={item.href} className="block border border-rule bg-paper p-2.5 hover:border-ink">
                    <p className="text-[13px] font-semibold leading-snug line-clamp-3">{item.title}</p>
                    <p className="mt-1.5 flex items-center justify-between text-[11px] text-ink-faint">
                      <span>{item.sub}</span>
                      <span className="flex items-center gap-1.5">
                        {item.gate === true && <span title="gate passed" className="text-green-700">●</span>}
                        {item.gate === false && <span title="gate failed" className="text-accent">●</span>}
                        {item.age}
                      </span>
                    </p>
                  </Link>
                ))}
                {col.items.length > 12 && (
                  <p className="text-center text-[11px] text-ink-faint">+{col.items.length - 12} more</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
