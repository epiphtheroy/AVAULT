import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { callClaude, extractJson, columnModel } from "@/lib/anthropic";
import { outreachIdentifyPrompt } from "@/lib/prompts";
import { logEvent } from "@/lib/pipeline";
import type { SourceRef } from "@/lib/types";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Phase 2 — outreach target identification (spec 5.6). Up to 10 people, public contact info only,
// suppression list enforced automatically (opted out / bounced / contacted in last 90 days).
export async function POST(req: Request) {
  const { ok, actor } = await requireAdmin();
  if (!ok || actor !== "wonwoo") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { articleId } = await req.json();
  const db = supabaseAdmin();
  const { data: article } = await db.from("articles").select("*").eq("id", articleId).single();
  if (!article || !article.published_at) {
    return NextResponse.json({ error: "outreach runs on published columns only" }, { status: 400 });
  }

  let byline: string | null = null;
  if (article.story_id) {
    const { data: story } = await db.from("stories").select("byline").eq("id", article.story_id).single();
    byline = story?.byline ?? null;
  }

  const result = await callClaude({
    prompt: outreachIdentifyPrompt(
      { headline: article.headline, body_md: article.body_md, sources: (article.sources_json as SourceRef[]) ?? [] },
      byline
    ),
    model: columnModel(),
    maxTokens: 6000,
    webSearch: true,
  });

  const found = extractJson<{
    name: string; role: string; why_relevant: string; email: string | null;
    email_source_url: string | null; email_confidence: "FOUND" | "GUESSED" | "MISSING";
    x_handle: string | null; rank: number;
  }[]>(result.text);

  // Suppression check: opted out, bounced, or contacted in the last 90 days.
  const { data: suppression } = await db.from("suppression_list").select("identifier");
  const suppressed = new Set((suppression ?? []).map((s) => s.identifier.toLowerCase()));

  const ninetyDaysAgo = new Date(Date.now() - 90 * 86400_000).toISOString();
  const { data: recentlyContacted } = await db
    .from("outreach_emails")
    .select("contact_id, contacts(email)")
    .eq("status", "SENT")
    .gte("sent_at", ninetyDaysAgo);
  const recentEmails = new Set(
    (recentlyContacted ?? [])
      .map((r) => (r.contacts as unknown as { email: string | null })?.email?.toLowerCase())
      .filter(Boolean) as string[]
  );

  const rows = found.slice(0, 10).map((p) => {
    const email = p.email?.toLowerCase() ?? null;
    const handle = p.x_handle?.toLowerCase() ?? null;
    const isSuppressed =
      (email && (suppressed.has(email) || recentEmails.has(email))) ||
      (handle && suppressed.has(handle));
    return {
      article_id: articleId,
      name: p.name,
      role: p.role,
      why_relevant: p.why_relevant,
      email: p.email,
      email_source_url: p.email_source_url,
      email_confidence: p.email_confidence ?? "MISSING",
      x_handle: p.x_handle,
      rank: p.rank,
      suppressed: !!isSuppressed,
      suppression_reason: isSuppressed ? "suppression list / contacted within 90 days" : null,
    };
  });

  // Re-running identify replaces the list (no duplicate stacking); contacts with a
  // sent/approved email are preserved so outreach history is never lost.
  const { data: existing } = await db.from("contacts").select("id").eq("article_id", articleId);
  const existingIds = (existing ?? []).map((c) => c.id);
  if (existingIds.length) {
    const { data: protectedEmails } = await db
      .from("outreach_emails").select("contact_id")
      .in("contact_id", existingIds)
      .in("status", ["SENT", "APPROVED"]);
    const keep = new Set((protectedEmails ?? []).map((e) => e.contact_id));
    const removable = existingIds.filter((id) => !keep.has(id));
    if (removable.length) await db.from("contacts").delete().in("id", removable);
  }

  const { error } = await db.from("contacts").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await db.from("articles").update({ status: "OUTREACH_PENDING" }).eq("id", articleId);
  await logEvent("article", articleId, "PUBLISHED", "OUTREACH_PENDING", "wonwoo", { contacts: rows.length });

  return NextResponse.json({ contacts: rows.length, suppressed: rows.filter((r) => r.suppressed).length });
}
