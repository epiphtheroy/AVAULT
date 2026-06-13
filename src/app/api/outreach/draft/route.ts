import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { callClaude, extractJson, outreachModel } from "@/lib/anthropic";
import { outreachDraftPrompt } from "@/lib/prompts";
import { logEvent } from "@/lib/pipeline";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Phase 2 — email drafting (spec 5.7). One email per eligible contact; constraints, not template.
export async function POST(req: Request) {
  const { ok, actor } = await requireAdmin();
  if (!ok || actor !== "wonwoo") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { articleId } = await req.json();
  const db = supabaseAdmin();

  const { data: article } = await db.from("articles").select("*").eq("id", articleId).single();
  if (!article) return NextResponse.json({ error: "article not found" }, { status: 404 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://avault.news";
  const url = `${siteUrl}/article/${article.url_slug}`;

  const { data: contacts } = await db
    .from("contacts")
    .select("*")
    .eq("article_id", articleId)
    .eq("suppressed", false);

  // Eligible: FOUND email, or GUESSED with explicit per-recipient opt-in (spec 5.6 hard rule).
  const eligible = (contacts ?? []).filter(
    (c) => c.email && (c.email_confidence === "FOUND" || (c.email_confidence === "GUESSED" && c.guess_opt_in))
  );

  let drafted = 0;
  for (const contact of eligible) {
    const { data: existing } = await db
      .from("outreach_emails").select("id").eq("contact_id", contact.id).limit(1);
    if (existing && existing.length) continue; // one email per person per column, max

    const result = await callClaude({
      prompt: outreachDraftPrompt(contact, {
        headline: article.headline,
        summary_line: article.summary_line,
        url,
      }),
      model: outreachModel(), // Haiku: simple personalized note (no Fable)
      maxTokens: 1500,
    });
    const draft = extractJson<{ subject: string; body: string }>(result.text);

    await db.from("outreach_emails").insert({
      contact_id: contact.id,
      draft_text: `Subject: ${draft.subject}\n\n${draft.body}`,
      status: "DRAFTED",
    });
    drafted++;
  }

  if (drafted > 0) {
    await db.from("articles").update({ status: "OUTREACH_DRAFTED" }).eq("id", articleId);
    await logEvent("article", articleId, article.status, "OUTREACH_DRAFTED", "wonwoo", { drafted });
  }

  return NextResponse.json({ eligible: eligible.length, drafted });
}
