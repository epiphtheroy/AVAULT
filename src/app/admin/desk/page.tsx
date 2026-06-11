import { supabaseServer } from "@/lib/supabase/server";
import type { Story } from "@/lib/types";
import { ActionButton } from "@/components/admin/ActionButton";
import { AddStoryForm } from "@/components/admin/AddStoryForm";
import { SelectTopThree } from "@/components/admin/SelectTopThree";

export const dynamic = "force-dynamic";

// Story Desk (spec 6.2): morning shortlist with rationales, one-click select, manual URL add.
export default async function StoryDesk() {
  const db = await supabaseServer();
  const today = new Date().toISOString().slice(0, 10);

  const [shortlistRes, detectedRes, slotsRes] = await Promise.all([
    db.from("stories").select("*").eq("status", "SHORTLISTED").order("selection_score", { ascending: false }).limit(20),
    db.from("stories").select("id", { count: "exact", head: true }).eq("status", "DETECTED"),
    db.from("articles").select("id").eq("slot_date", today).not("status", "in", "(REJECTED,KILLED)"),
  ]);

  const shortlist = (shortlistRes.data ?? []) as Story[];
  const detectedCount = detectedRes.count ?? 0;
  const slotsUsed = (slotsRes.data ?? []).length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-rule-dark pb-2">
        <h1 className="font-sans text-sm font-bold uppercase tracking-[0.14em]">Story Desk</h1>
        <div className="flex gap-2">
          <ActionButton endpoint="/api/cron/detect" label={`Detect now (${detectedCount} pooled)`} busyLabel="Pulling feeds…" variant="ghost" />
          <ActionButton endpoint="/api/pipeline/select" label="Run selection" busyLabel="Ranking…" variant="primary" />
        </div>
      </div>

      <p className="mt-3 text-[13px] text-ink-soft">
        {slotsUsed}/3 slots filled for {today}. Selection ranks the pool on ethical conflict density,
        deep-issue presence, search demand, outreach potential, and 7-day topic diversity.
      </p>

      <SelectTopThree
        storyIds={shortlist.slice(0, 3).map((s) => s.id)}
        disabled={slotsUsed >= 3 || shortlist.length === 0}
      />

      <div className="mt-4 space-y-3">
        {shortlist.length === 0 && (
          <p className="border border-dashed border-rule p-6 text-center text-sm text-ink-faint">
            No shortlist yet. Run detection, then selection.
          </p>
        )}
        {shortlist.map((s, i) => (
          <div key={s.id} className="border border-rule bg-paper p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="kicker">#{i + 1} · {s.outlet} · score {s.selection_score ?? "—"}</p>
                <a href={s.url} target="_blank" rel="noopener" className="hed mt-1 block text-[17px] hover:text-accent">
                  {s.headline}
                </a>
              </div>
            </div>
            {s.selection_rationale && (
              <p className="mt-2 border-l-2 border-rule pl-3 text-[13px] leading-relaxed text-ink-soft">
                {s.selection_rationale}
              </p>
            )}
            <div className="mt-3 flex gap-2">
              <ActionButton
                endpoint="/api/pipeline/draft"
                payload={{ storyId: s.id }}
                label="Select → research & draft"
                busyLabel="Drafting (1–3 min)…"
                variant="accent"
              />
              <ActionButton
                endpoint="/api/pipeline/status"
                payload={{ entity: "story", id: s.id, action: "reject", reason: "editor pass" }}
                label="Pass"
                variant="ghost"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 border-t-2 border-rule-dark pt-4">
        <h2 className="font-sans text-xs font-bold uppercase tracking-[0.14em]">Force-add a story by URL</h2>
        <AddStoryForm />
      </div>
    </div>
  );
}
