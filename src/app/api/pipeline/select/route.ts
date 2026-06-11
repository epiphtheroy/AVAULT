import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { callClaude, extractJson, utilityModel } from "@/lib/anthropic";
import { selectionPrompt } from "@/lib/prompts";
import { logEvent } from "@/lib/pipeline";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

// Selection step (spec 4.3 / 5.2): score DETECTED stories, mark top 8 SHORTLISTED.
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

  // Diversity input: topics of the last 7 days of published columns.
  const { data: recent } = await db
    .from("articles")
    .select("topic_tags, headline")
    .not("published_at", "is", null)
    .gte("published_at", new Date(Date.now() - 7 * 86400_000).toISOString());
  const recentTopics = [
    ...new Set((recent ?? []).flatMap((a) => (a.topic_tags as string[]) ?? [])),
  ];

  const model = utilityModel();
  const result = await callClaude({
    prompt: selectionPrompt(candidates, recentTopics),
    model,
    maxTokens: 4000,
  });

  const ranked = extractJson<{ id: string; score: number; rationale: string }[]>(result.text);
  const top = ranked.slice(0, 8);

  for (const r of top) {
    await db.from("stories")
      .update({ status: "SHORTLISTED", selection_score: r.score, selection_rationale: r.rationale })
      .eq("id", r.id).eq("status", "DETECTED");
    await logEvent("story", r.id, "DETECTED", "SHORTLISTED", model, { score: r.score });
  }

  await logEvent("system", null, null, null, actor, { job: "select", candidates: candidates.length, shortlisted: top.length, model });
  return NextResponse.json({ candidates: candidates.length, shortlisted: top.length });
}
