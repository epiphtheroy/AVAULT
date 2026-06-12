import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { logEvent, firstLine, lastLine } from "@/lib/pipeline";
import { afterPublish } from "@/lib/seo";

export const dynamic = "force-dynamic";

// The daily opening: releases articles Wonwoo already APPROVED whose scheduled time has arrived.
// This is not auto-publishing — approval (the human gate) happened in the editor; this only opens the vault.
export async function GET(req: Request) {
  const { ok } = await requireAdmin(req);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = supabaseAdmin();
  const { data: due } = await db
    .from("articles")
    .select("*")
    .eq("status", "APPROVED")
    .lte("scheduled_for", new Date().toISOString());

  let opened = 0;
  for (const article of due ?? []) {
    await db.from("articles").update({
      status: "PUBLISHED",
      published_at: new Date().toISOString(),
      opening_line: firstLine(article.body_md ?? ""),
      closing_line: lastLine(article.body_md ?? ""),
    }).eq("id", article.id);
    if (article.story_id) {
      await db.from("stories").update({ status: "PUBLISHED" }).eq("id", article.story_id);
    }
    await logEvent("article", article.id, "APPROVED", "PUBLISHED", "system", { opening: true });
    if (article.url_slug) afterPublish(article.url_slug, article.id);
    opened++;
  }

  if (opened > 0) {
    revalidatePath("/");
    revalidatePath("/vault");
    revalidatePath("/sitemap.xml");
    revalidatePath("/rss.xml");
  }

  return NextResponse.json({ opened });
}
