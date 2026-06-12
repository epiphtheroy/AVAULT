import { supabaseServer } from "@/lib/supabase/server";
import type { Story } from "@/lib/types";
import { mdToHtml } from "@/lib/markdown";
import { ActionButton } from "@/components/admin/ActionButton";
import { AddStoryForm } from "@/components/admin/AddStoryForm";
import { SelectTopThree } from "@/components/admin/SelectTopThree";

export const dynamic = "force-dynamic";

function minutesLeft(fromIso: string | null, windowMin: number): number | null {
  if (!fromIso || windowMin <= 0) return null;
  return Math.round((new Date(fromIso).getTime() + windowMin * 60_000 - Date.now()) / 60_000);
}

// Story Desk (spec 6.2, editor-revised): top-3 shortlist with KO review translations
// and the 30-minute auto-accept window.
export default async function StoryDesk() {
  const db = await supabaseServer();
  const today = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10); // KST day

  const [shortlistRes, detectedRes, slotsRes, settingRes] = await Promise.all([
    db.from("stories").select("*").eq("status", "SHORTLISTED").order("selection_score", { ascending: false }).limit(10),
    db.from("stories").select("id", { count: "exact", head: true }).eq("status", "DETECTED"),
    db.from("articles").select("id").eq("slot_date", today).not("status", "in", "(REJECTED,KILLED)"),
    db.from("app_settings").select("value").eq("key", "auto_accept_minutes").maybeSingle(),
  ]);

  const shortlist = (shortlistRes.data ?? []) as Story[];
  const detectedCount = detectedRes.count ?? 0;
  const slotsUsed = (slotsRes.data ?? []).length;
  const acceptMin = settingRes.data ? Number(settingRes.data.value) : 30;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-rule-dark pb-2">
        <h1 className="font-sans text-sm font-bold uppercase tracking-[0.14em]">Story Desk</h1>
        <div className="flex gap-2">
          <ActionButton endpoint="/api/cron/detect" label={`Detect now (${detectedCount} pooled)`} busyLabel="Pulling feeds…" variant="ghost" />
          <ActionButton endpoint="/api/pipeline/select" label="Run selection" busyLabel="Ranking (Opus, 1–2 min)…" variant="primary" />
        </div>
      </div>

      <p className="mt-3 text-[13px] text-ink-soft">
        {slotsUsed}/3 slots filled for {today} (KST). Selection picks the top 3 by sustained
        reflective depth (case-study test), conflict density, search demand, outreach potential,
        and 7-day diversity.
        {acceptMin > 0 && (
          <span className="font-semibold"> 숏리스트 후 {acceptMin}분 내 무행동 시 자동 수락되어 작성에 들어갑니다.</span>
        )}
      </p>

      <SelectTopThree
        storyIds={shortlist.slice(0, 3 - slotsUsed > 0 ? 3 - slotsUsed : 0).map((s) => s.id)}
        disabled={slotsUsed >= 3 || shortlist.length === 0}
      />

      <div className="mt-4 space-y-3">
        {shortlist.length === 0 && (
          <p className="border border-dashed border-rule p-6 text-center text-sm text-ink-faint">
            No shortlist yet. Run detection, then selection. (05:00 KST 이후에는 자동으로 선별이 한 번 돌아갑니다.)
          </p>
        )}
        {shortlist.map((s, i) => {
          const left = minutesLeft(s.shortlisted_at, acceptMin);
          return (
            <div key={s.id} className="border border-rule bg-paper p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="kicker">#{i + 1} · {s.outlet} · score {s.selection_score ?? "—"}</p>
                  <a href={s.url} target="_blank" rel="noopener" className="hed mt-1 block text-[17px] hover:text-accent">
                    {s.headline}
                  </a>
                </div>
                {left !== null && slotsUsed < 3 && (
                  <span className={`shrink-0 px-2 py-1 text-[11px] font-bold ${left <= 0 ? "bg-accent text-white" : "bg-paper-warm text-ink-soft border border-rule"}`}>
                    {left <= 0 ? "자동 수락 대기" : `자동 수락까지 ~${left}분`}
                  </span>
                )}
              </div>
              {s.selection_rationale && (
                <p className="mt-2 border-l-2 border-rule pl-3 text-[13px] leading-relaxed text-ink-soft">
                  {s.selection_rationale}
                </p>
              )}
              {s.ko_review_md ? (
                <details className="mt-2 border border-rule bg-paper-warm">
                  <summary className="cursor-pointer px-3 py-2 text-[12px] font-bold">한국어 검토본 (영·한 병기)</summary>
                  <div
                    className="prose-avault max-w-none px-3 pb-3 text-[13px]"
                    dangerouslySetInnerHTML={{ __html: mdToHtml(s.ko_review_md) }}
                  />
                </details>
              ) : (
                <p className="mt-2 text-[11px] text-ink-faint">한국어 검토본 생성 중… (수 분 내 자동 생성)</p>
              )}
              <div className="mt-3 flex gap-2">
                <ActionButton
                  endpoint="/api/pipeline/draft"
                  payload={{ storyId: s.id }}
                  label="Select → research & draft"
                  busyLabel="Drafting (2–5 min)…"
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
          );
        })}
      </div>

      <div className="mt-8 border-t-2 border-rule-dark pt-4">
        <h2 className="font-sans text-xs font-bold uppercase tracking-[0.14em]">Force-add a story by URL</h2>
        <AddStoryForm />
      </div>
    </div>
  );
}
