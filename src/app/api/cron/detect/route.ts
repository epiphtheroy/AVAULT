import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { logEvent } from "@/lib/pipeline";
import { DEFAULT_FEEDS, fetchFeed, clusterId } from "@/lib/rss";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Scheduled detect (spec 5.1): pull candidates from authoritative-outlet RSS, dedupe by cluster.
// GET: Vercel cron (bearer secret). POST: "Detect now" from the Story Desk (admin session).
export async function POST(req: Request) {
  return GET(req);
}

export async function GET(req: Request) {
  const { ok } = await requireAdmin(req);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = supabaseAdmin();

  // Feeds configurable via app_settings.rss_feeds; fall back to defaults.
  let feeds = DEFAULT_FEEDS;
  const { data: setting } = await db.from("app_settings").select("value").eq("key", "rss_feeds").maybeSingle();
  if (setting?.value && Array.isArray(setting.value) && setting.value.length) {
    feeds = setting.value as typeof DEFAULT_FEEDS;
  }

  const results = await Promise.all(feeds.map((f) => fetchFeed(f.url, f.outlet)));
  const items = results.flat();

  // Dedupe within batch by cluster: keep the earliest-published as primary source.
  const seen = new Map<string, (typeof items)[number]>();
  for (const item of items) {
    const cid = clusterId(item.title);
    if (!seen.has(cid)) seen.set(cid, item);
  }

  // One query: clusters already seen in the last 48h (instead of per-item round trips).
  const { data: recentClusters } = await db
    .from("stories")
    .select("cluster_id")
    .gte("detected_at", new Date(Date.now() - 48 * 3600_000).toISOString());
  const known = new Set((recentClusters ?? []).map((r) => r.cluster_id));

  const rows = [...seen.entries()]
    .filter(([cid]) => !known.has(cid))
    .map(([cid, item]) => ({
      cluster_id: cid,
      outlet: item.outlet,
      url: item.link,
      headline: item.title,
      byline: item.byline,
      published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
      summary: item.description?.slice(0, 1000) ?? null,
      status: "DETECTED" as const,
    }));

  let inserted = 0;
  if (rows.length) {
    const { error, count } = await db
      .from("stories")
      .upsert(rows, { onConflict: "url", ignoreDuplicates: true, count: "exact" });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    inserted = count ?? rows.length;
  }

  await logEvent("system", null, null, null, "system", { job: "detect", feeds: feeds.length, fetched: items.length, inserted });
  return NextResponse.json({ fetched: items.length, clusters: seen.size, inserted });
}
