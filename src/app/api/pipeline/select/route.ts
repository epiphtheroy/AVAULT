import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { callClaude, extractJson, selectionModel } from "@/lib/anthropic";
import { selectionPrompt } from "@/lib/prompts";
import { logEvent } from "@/lib/pipeline";
import { translateForReview } from "@/lib/translate";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Selection (spec 4.3 / 5.2, editor-revised 2026-06-12): Opus + extended thinking picks
// exactly the top 3 by reflective depth; each pick gets an EN/KO review translation (Haiku).
export async function POST(req: Request) {
  const { ok, actor } = await requireAdmin(req);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = supabaseAdmin();

  const since = new Date(Date.now() - 36 * 3600_000).toISOString();
  const { data: candidates } = await db
    .from("stories")
    .select("id, outlet, headline, summary, url, published_at")
    .eq("status", "DETECTED")
    .gte("detected_at", since)
    .order("detected_at", { ascending: false })
    .limit(60);

  if (!candidates || candidates.length === 0) {
    return NextResponse.json({ shortlisted: 0, message: "no DETECTED candidates in the last 36h" });
  }

  const { data: recent } = await db
    .from("articles")
    .select("topic_tags, headline")
    .not("published_at", "is", null)
    .gte("published_at", new Date(Date.now() - 7 * 86400_000).toISOString());
  const recentTopics = [
    ...new Set((recent ?? []).flatMap((a) => (a.topic_tags as string[]) ?? [])),
  ];

  const model = selectionModel();
  const result = await callClaude({
    prompt: selectionPrompt(candidates, recentTopics),
    model,
    maxTokens: 12000,
    thinkingBudget: 6000,
  });

  const ranked = extractJson<{ id: string; score: number; rationale: string }[]>(result.text);
  const top = ranked.slice(0, 3);
  const now = new Date().toISOString();

  for (const r of top) {
    await db.from("stories")
      .update({ status: "SHORTLISTED", selection_score: r.score, selection_rationale: r.rationale, shortlisted_at: now })
      .eq("id", r.id).eq("status", "DETECTED");
    await logEvent("story", r.id, "DETECTED", "SHORTLISTED", model, { score: r.score });
  }

  // KST day stamp so the auto-selection trigger runs once per Korean day.
  const kstDate = new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
  await db.from("app_settings").upsert({ key: "last_selection_date", value: JSON.stringify(kstDate) });

  // EN/KO review translations (cheap model). Failures are non-fatal; auto-actions retries.
  let translated = 0;
  for (const r of top) {
    const story = candidates.find((c) => c.id === r.id);
    if (!story) continue;
    try {
      const ko = await translateForReview(
        `## ${story.headline}\n\n${story.summary ?? ""}\n\n**Why selected**: ${r.rationale}`
      );
      await db.from("stories").update({ ko_review_md: ko }).eq("id", r.id);
      translated++;
    } catch {
      // retried by auto-actions
    }
  }

  await logEvent("system", null, null, null, actor, {
    job: "select", candidates: candidates.length, shortlisted: top.length, translated, model,
  });
  return NextResponse.json({ candidates: candidates.length, shortlisted: top.length, translated });
}
