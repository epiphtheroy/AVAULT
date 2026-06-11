import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { logEvent } from "@/lib/pipeline";
import { clusterId } from "@/lib/rss";

export const dynamic = "force-dynamic";

// Story Desk manual URL paste (spec 6.2): force-add a story to the pool.
export async function POST(req: Request) {
  const { ok, actor } = await requireAdmin();
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { url, headline, outlet, summary } = await req.json();
  if (!url) return NextResponse.json({ error: "url required" }, { status: 400 });

  let title = headline as string | undefined;
  let site = outlet as string | undefined;

  // Best-effort metadata fetch if not provided.
  if (!title || !site) {
    try {
      const res = await fetch(url, {
        headers: { "user-agent": "AVAULT/1.0" },
        signal: AbortSignal.timeout(8000),
      });
      const html = await res.text();
      title = title
        ?? html.match(/<meta property="og:title" content="([^"]+)"/i)?.[1]
        ?? html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim();
      site = site
        ?? html.match(/<meta property="og:site_name" content="([^"]+)"/i)?.[1]
        ?? new URL(url).hostname.replace(/^www\./, "");
    } catch {
      site = site ?? new URL(url).hostname.replace(/^www\./, "");
    }
  }
  if (!title) return NextResponse.json({ error: "could not determine headline; pass one explicitly" }, { status: 422 });

  const db = supabaseAdmin();
  const { data, error } = await db.from("stories").upsert(
    {
      cluster_id: clusterId(title),
      outlet: site ?? "manual",
      url: url.split("?")[0],
      headline: title,
      summary: summary ?? null,
      status: "SHORTLISTED",
      selection_rationale: "manually added by editor",
    },
    { onConflict: "url" }
  ).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await logEvent("story", data.id, null, "SHORTLISTED", actor, { manual: true });
  return NextResponse.json({ story: data });
}
