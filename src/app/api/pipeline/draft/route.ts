import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { callClaude, extractJson, columnModel } from "@/lib/anthropic";
import { COLUMN_PRODUCTION_PROMPT, antiRepetitionDigest, columnUserPrompt } from "@/lib/prompts";
import { getRecentDigest, logEvent } from "@/lib/pipeline";
import type { SourceRef } from "@/lib/types";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

interface DraftPayload {
  headline: string;
  deck: string;
  summary_line: string;
  body_md: string;
  theorists: string[];
  intervention_type: string;
  topic_tags: string[];
  sources: SourceRef[];
}

// Research & draft (spec 5.3). One Fable 5 call, web search enabled, digest injected (4.2 — required).
// Also used for regeneration: pass articleId + feedback (gate failure report or editor notes).
export async function POST(req: Request) {
  const { ok, actor } = await requireAdmin(req);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { storyId, articleId, feedback, slotDate } = await req.json();
  const db = supabaseAdmin();

  let article;
  let story;

  if (articleId) {
    // Regeneration path
    const { data: a } = await db.from("articles").select("*").eq("id", articleId).single();
    if (!a) return NextResponse.json({ error: "article not found" }, { status: 404 });
    if (a.regen_count >= 2) {
      return NextResponse.json({ error: "two consecutive regenerations reached; manual edit required (spec 5.4)" }, { status: 409 });
    }
    article = a;
    const { data: s } = await db.from("stories").select("*").eq("id", a.story_id).single();
    story = s;
  } else {
    if (!storyId) return NextResponse.json({ error: "storyId or articleId required" }, { status: 400 });
    const { data: s } = await db.from("stories").select("*").eq("id", storyId).single();
    if (!s) return NextResponse.json({ error: "story not found" }, { status: 404 });
    story = s;

    const slot = slotDate ?? new Date().toISOString().slice(0, 10);
    await db.from("stories").update({ status: "SELECTED", slot_date: slot }).eq("id", storyId);
    await logEvent("story", storyId, story.status, "SELECTED", actor);

    const { data: created, error } = await db
      .from("articles")
      .insert({ story_id: storyId, slot_date: slot, status: "RESEARCHING" })
      .select()
      .single();
    if (error || !created) return NextResponse.json({ error: error?.message }, { status: 500 });
    article = created;
    await logEvent("article", article.id, null, "RESEARCHING", actor);
  }

  if (!story) return NextResponse.json({ error: "source story missing" }, { status: 500 });

  // Anti-repetition digest: REQUIRED on every generation call (spec 4.2).
  const digestEntries = await getRecentDigest();
  const digest = antiRepetitionDigest(digestEntries);

  let prompt = columnUserPrompt(story, digest);
  if (feedback) {
    prompt += `\n\nPREVIOUS ATTEMPT FAILED THE QUALITY GATE OR RECEIVED EDITOR NOTES. Address every point below; regenerate the full column.\n${typeof feedback === "string" ? feedback : JSON.stringify(feedback, null, 2)}`;
  }

  const model = columnModel(); // claude-fable-5; never silently substituted (spec Section 3)
  try {
    const result = await callClaude({
      system: COLUMN_PRODUCTION_PROMPT,
      prompt,
      model,
      maxTokens: 16000,
      webSearch: true,
    });

    const draft = extractJson<DraftPayload>(result.text);

    const update = {
      headline: draft.headline,
      deck: draft.deck,
      summary_line: draft.summary_line,
      body_md: draft.body_md,
      sources_json: draft.sources ?? [],
      theorists_json: draft.theorists ?? [],
      intervention_type: draft.intervention_type ?? null,
      topic_tags: draft.topic_tags ?? [],
      status: "DRAFTED",
      regen_count: articleId ? (article.regen_count ?? 0) + 1 : 0,
    };

    await db.from("articles").update(update).eq("id", article.id);
    await db.from("article_versions").insert({
      article_id: article.id,
      headline: draft.headline,
      deck: draft.deck,
      summary_line: draft.summary_line,
      body_md: draft.body_md,
      note: articleId ? `regeneration ${update.regen_count}` : "initial draft",
    });

    await logEvent("article", article.id, article.status, "DRAFTED", model, {
      usage: result.usage,
      regen: !!articleId,
    });

    return NextResponse.json({ articleId: article.id, status: "DRAFTED", usage: result.usage });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "generation failed";
    await logEvent("article", article.id, article.status, article.status, model, { error: msg });
    return NextResponse.json({ error: msg, articleId: article.id }, { status: 500 });
  }
}
