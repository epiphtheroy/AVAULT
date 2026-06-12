import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { callClaude, extractJson, translationModel } from "@/lib/anthropic";
import { logEvent } from "@/lib/pipeline";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

interface EditPlan {
  new_article_edits: { original_sentence: string; replacement_sentence: string }[];
  old_article_edits: { article_id: string; original_sentence: string; replacement_sentence: string }[];
}

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL || "https://avault.news";

/** A replacement is valid iff stripping its markdown links yields exactly the original
 *  sentence, and every inserted URL belongs to the allowed set. */
function validEdit(original: string, replacement: string, allowedUrls: Set<string>): boolean {
  if (original === replacement) return false;
  const stripped = replacement.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text) => text);
  if (stripped !== original) return false;
  const urls = [...replacement.matchAll(/\]\(([^)]+)\)/g)].map((m) => m[1]);
  return urls.length > 0 && urls.every((u) => allowedUrls.has(u));
}

// Bidirectional contextual internal links after publish (SEO build, 2026-06-12).
// Cheap model proposes edits; code applies them only if provably link-only changes.
export async function POST(req: Request) {
  const { ok } = await requireAdmin(req);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { articleId } = await req.json();
  const db = supabaseAdmin();

  const { data: art } = await db.from("articles").select("*").eq("id", articleId).single();
  if (!art?.published_at || !art.url_slug || !art.body_md) {
    return NextResponse.json({ error: "article not published" }, { status: 400 });
  }
  const tags = (art.topic_tags as string[]) ?? [];
  if (!tags.length) return NextResponse.json({ linked: 0, reason: "no tags" });

  const { data: cands } = await db
    .from("articles")
    .select("id, headline, summary_line, url_slug, body_md, topic_tags")
    .overlaps("topic_tags", tags)
    .neq("id", articleId)
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(4);
  if (!cands || cands.length === 0) return NextResponse.json({ linked: 0, reason: "no related articles" });

  const urlOf = (slug: string) => `${siteUrl()}/article/${slug}`;
  const allowedNewTargets = new Set(cands.map((c) => urlOf(c.url_slug)));
  const newUrl = urlOf(art.url_slug);

  const oldForBackref = cands[0]; // most recent overlapping article receives one link to the new piece

  const prompt = `You add internal links between articles of the publication AVAULT. Propose minimal, natural contextual links. STRICT RULES: each replacement_sentence must be EXACTLY the original_sentence with one markdown link [existing words](url) wrapped around an existing phrase. Do not reword, add, or remove any other character. Choose sentences where the link is genuinely relevant. Never link inside headings, bold signpost lead-ins, bullets that are already links, or the Sources block.

NEW ARTICLE (url: ${newUrl})
Headline: ${art.headline}
Body:
${art.body_md.slice(0, 9000)}

LINK TARGETS for the new article (choose up to 2, only if truly relevant):
${cands.map((c) => `- ${urlOf(c.url_slug)} — "${c.headline}" — ${c.summary_line ?? ""}`).join("\n")}

OLD ARTICLE to receive one link back to the new article (id: ${oldForBackref.id}, link url: ${newUrl})
Headline: ${oldForBackref.headline}
Body:
${(oldForBackref.body_md ?? "").slice(0, 9000)}

Return JSON in a \`\`\`json fence:
{"new_article_edits":[{"original_sentence":string,"replacement_sentence":string}],"old_article_edits":[{"article_id":"${oldForBackref.id}","original_sentence":string,"replacement_sentence":string}]}
Up to 2 new_article_edits and up to 1 old_article_edits. If nothing fits naturally, return empty arrays.`;

  const result = await callClaude({ prompt, model: translationModel(), maxTokens: 2000, temperature: 0 });
  const plan = extractJson<EditPlan>(result.text);

  let linked = 0;

  // New article: link out to related verdicts.
  let newBody = art.body_md as string;
  for (const e of (plan.new_article_edits ?? []).slice(0, 2)) {
    if (validEdit(e.original_sentence, e.replacement_sentence, allowedNewTargets) &&
        newBody.includes(e.original_sentence)) {
      newBody = newBody.replace(e.original_sentence, e.replacement_sentence);
      linked++;
    }
  }
  if (newBody !== art.body_md) {
    await db.from("articles").update({ body_md: newBody }).eq("id", articleId);
    revalidatePath(`/article/${art.url_slug}`);
  }

  // Old article: one link back to the new verdict.
  for (const e of (plan.old_article_edits ?? []).slice(0, 1)) {
    if (e.article_id !== oldForBackref.id) continue;
    const oldBody = oldForBackref.body_md as string;
    if (validEdit(e.original_sentence, e.replacement_sentence, new Set([newUrl])) &&
        oldBody.includes(e.original_sentence)) {
      await db.from("articles").update({ body_md: oldBody.replace(e.original_sentence, e.replacement_sentence) }).eq("id", oldForBackref.id);
      revalidatePath(`/article/${oldForBackref.url_slug}`);
      linked++;
    }
  }

  await logEvent("article", articleId, null, null, "system:backfill-links", { linked });
  return NextResponse.json({ linked });
}
