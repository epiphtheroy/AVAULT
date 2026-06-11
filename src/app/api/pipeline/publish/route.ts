import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { logEvent, slugify, readingTime, firstLine, lastLine } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

// HUMAN GATE (spec 3, 5.5, 9.6): publishing requires Wonwoo's session. Cron secret is NOT accepted here.
// Nothing publishes without this click. mode: "now" | "queue" (next 6:00 a.m. ET opening).
export async function POST(req: Request) {
  const { ok, actor } = await requireAdmin(); // session only — no req passed, so no cron bypass
  if (!ok || actor !== "wonwoo") {
    return NextResponse.json({ error: "publishing requires the editor's login" }, { status: 401 });
  }

  const { articleId, mode } = await req.json();
  if (!articleId) return NextResponse.json({ error: "articleId required" }, { status: 400 });

  const db = supabaseAdmin();
  const { data: article } = await db.from("articles").select("*").eq("id", articleId).single();
  if (!article?.body_md || !article.headline) {
    return NextResponse.json({ error: "article incomplete" }, { status: 400 });
  }

  const slug = article.url_slug ?? `${slugify(article.headline)}-${articleId.slice(0, 6)}`;

  if (mode === "queue") {
    // Next 6:00 a.m. ET opening (10:00 UTC during DST, 11:00 otherwise; we store 10:00 UTC and
    // the open-vault cron runs hourly, so the slot self-corrects).
    const now = new Date();
    const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 10, 0, 0));
    if (next <= now) next.setUTCDate(next.getUTCDate() + 1);

    await db.from("articles").update({
      status: "APPROVED",
      url_slug: slug,
      scheduled_for: next.toISOString(),
      reading_time_min: readingTime(article.body_md),
    }).eq("id", articleId);

    await logEvent("article", articleId, article.status, "APPROVED", "wonwoo", { scheduled_for: next.toISOString() });
    return NextResponse.json({ articleId, status: "APPROVED", scheduled_for: next.toISOString(), slug });
  }

  await db.from("articles").update({
    status: "PUBLISHED",
    url_slug: slug,
    published_at: new Date().toISOString(),
    opening_line: firstLine(article.body_md),
    closing_line: lastLine(article.body_md),
    reading_time_min: readingTime(article.body_md),
  }).eq("id", articleId);

  if (article.story_id) {
    await db.from("stories").update({ status: "PUBLISHED" }).eq("id", article.story_id);
  }

  await logEvent("article", articleId, article.status, "PUBLISHED", "wonwoo");

  revalidatePath("/");
  revalidatePath("/vault");
  revalidatePath(`/article/${slug}`);
  revalidatePath("/sitemap.xml");
  revalidatePath("/rss.xml");

  return NextResponse.json({ articleId, status: "PUBLISHED", slug, url: `/article/${slug}` });
}
