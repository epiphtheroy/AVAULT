import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { logEvent } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

// Generic editor transitions: reject/kill/flag-for-reopening, inline edits with versioning.
export async function POST(req: Request) {
  const { ok, actor } = await requireAdmin();
  if (!ok || actor !== "wonwoo") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { entity, id, action, fields, reason } = await req.json();
  const db = supabaseAdmin();

  if (entity === "story") {
    if (action === "reject" || action === "kill") {
      const to = action === "reject" ? "REJECTED" : "KILLED";
      const { data: s } = await db.from("stories").select("status").eq("id", id).single();
      await db.from("stories").update({ status: to }).eq("id", id);
      await logEvent("story", id, s?.status ?? null, to, "wonwoo", { reason });
      return NextResponse.json({ ok: true });
    }
  }

  if (entity === "article") {
    const { data: a } = await db.from("articles").select("*").eq("id", id).single();
    if (!a) return NextResponse.json({ error: "not found" }, { status: 404 });

    if (action === "kill") {
      await db.from("articles").update({ status: "KILLED" }).eq("id", id);
      await logEvent("article", id, a.status, "KILLED", "wonwoo", { reason });
      return NextResponse.json({ ok: true });
    }

    if (action === "edit" && fields) {
      const allowed = ["headline", "deck", "summary_line", "body_md", "topic_tags", "intervention_type", "slot_date"] as const;
      const update: Record<string, unknown> = {};
      for (const k of allowed) if (k in fields) update[k] = fields[k];
      // An edit restarts the 30-minute auto-publish window.
      if (a.status === "IN_REVIEW" && a.review_requested_at) update.review_requested_at = new Date().toISOString();
      await db.from("articles").update(update).eq("id", id);
      await db.from("article_versions").insert({
        article_id: id,
        headline: fields.headline ?? a.headline,
        deck: fields.deck ?? a.deck,
        summary_line: fields.summary_line ?? a.summary_line,
        body_md: fields.body_md ?? a.body_md,
        note: "manual edit",
      });
      await logEvent("article", id, a.status, a.status, "wonwoo", { edited: Object.keys(update) });
      return NextResponse.json({ ok: true });
    }

    if (action === "flag_reopening") {
      await db.from("articles").update({ flagged_for_reopening: !a.flagged_for_reopening }).eq("id", id);
      await logEvent("article", id, a.status, a.status, "wonwoo", { flagged_for_reopening: !a.flagged_for_reopening });
      return NextResponse.json({ ok: true, flagged: !a.flagged_for_reopening });
    }
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
