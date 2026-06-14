import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { logEvent, slugify, readingTime, firstLine, lastLine } from "@/lib/pipeline";
import { translateForReview } from "@/lib/translate";
import { afterPublish } from "@/lib/seo";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Heartbeat (pg_cron, every 5 min). Implements the editor's standing rules (2026-06-12):
//   1. Shortlist untouched for N minutes → auto-accept remaining slots → research & draft.
//   2. Gate-passed draft in review for N minutes with no editor action → treated as read
//      and approved → publish. (Editor's explicit standing override of spec §9.6;
//      set auto_publish_minutes to 0 in app_settings to turn off.)
// Plus housekeeping: daily auto-selection after morning detect, gate/regen chaining,
// missing-translation retries, stuck-draft recovery.
//
// Budget discipline: cheap ops every run; at most ONE heavy model op fired per run
// (fire-and-forget; the next heartbeat picks up the result).

const PUBLISHED_STATES = ["PUBLISHED", "OUTREACH_PENDING", "OUTREACH_DRAFTED", "OUTREACH_APPROVED", "SENT", "TRACKING"];

function kstDate(): string {
  return new Date(Date.now() + 9 * 3600_000).toISOString().slice(0, 10);
}
function kstHour(): number {
  return new Date(Date.now() + 9 * 3600_000).getUTCHours();
}

async function setting(db: ReturnType<typeof supabaseAdmin>, key: string, fallback: number): Promise<number> {
  const { data } = await db.from("app_settings").select("value").eq("key", key).maybeSingle();
  const n = data ? Number(data.value) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function fireAndForget(path: string, body: Record<string, unknown>) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://avault.news";
  // 5s window to hand the request off; the invoked function keeps running server-side.
  return fetch(`${base}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  }).catch(() => undefined);
}

export async function GET(req: Request) {
  const { ok } = await requireAdmin(req);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = supabaseAdmin();
  const acceptMin = await setting(db, "auto_accept_minutes", 30);
  const publishMin = await setting(db, "auto_publish_minutes", 30);
  const today = kstDate();
  const summary: Record<string, unknown> = { today };

  // ── 1. Auto-publish: gate-passed, in review longer than the window, untouched.
  if (publishMin > 0) {
    const cutoff = new Date(Date.now() - publishMin * 60_000).toISOString();
    const { data: due } = await db
      .from("articles").select("*")
      .eq("status", "IN_REVIEW")
      .not("review_requested_at", "is", null)
      .lte("review_requested_at", cutoff);

    let published = 0;
    for (const article of due ?? []) {
      if (!article.gate_report_json?.pass || !article.body_md || !article.headline) continue;
      const slug = article.url_slug ?? `${slugify(article.headline)}-${article.id.slice(0, 6)}`;
      await db.from("articles").update({
        status: "PUBLISHED",
        url_slug: slug,
        published_at: new Date().toISOString(),
        opening_line: firstLine(article.body_md),
        closing_line: lastLine(article.body_md),
        reading_time_min: readingTime(article.body_md),
      }).eq("id", article.id);
      if (article.story_id) await db.from("stories").update({ status: "PUBLISHED" }).eq("id", article.story_id);
      await logEvent("article", article.id, "IN_REVIEW", "PUBLISHED", "system:auto-approve", {
        rule: `no editor action within ${publishMin}m of review request`,
      });
      afterPublish(slug, article.id);
      published++;
    }
    if (published > 0) {
      revalidatePath("/"); revalidatePath("/vault"); revalidatePath("/sitemap.xml"); revalidatePath("/rss.xml");
    }
    summary.autoPublished = published;
  }

  // ── 2. Missing KO review translations (cheap; up to 1 article + 3 stories per run).
  const { data: untranslatedArts } = await db
    .from("articles").select("id, headline, deck, summary_line, body_md")
    .in("status", ["DRAFTED", "GATED", "IN_REVIEW"])
    .is("ko_review_md", null).not("body_md", "is", null).limit(1);
  for (const a of untranslatedArts ?? []) {
    try {
      const ko = await translateForReview(`# ${a.headline}\n\n${a.deck}\n\n**${a.summary_line}**\n\n${a.body_md}`);
      await db.from("articles").update({ ko_review_md: ko }).eq("id", a.id);
      summary.articleTranslated = a.id;
    } catch { /* next run */ }
  }
  const { data: untranslatedStories } = await db
    .from("stories").select("id, headline, summary, selection_rationale")
    .eq("status", "SHORTLISTED").is("ko_review_md", null).limit(3);
  for (const s of untranslatedStories ?? []) {
    try {
      const ko = await translateForReview(
        `## ${s.headline}\n\n${s.summary ?? ""}\n\n**Why selected**: ${s.selection_rationale ?? ""}`
      );
      await db.from("stories").update({ ko_review_md: ko }).eq("id", s.id);
    } catch { /* next run */ }
  }

  // ── 2c. Auto-outreach send (cheap; the send route enforces cap + per-run throttle).
  // Master switch app_settings.outreach_send_enabled (0 = off, default). Editor enabled
  // full-auto send 2026-06-14, overriding the spec's "no auto-send" rule.
  const outreachOn = (await setting(db, "outreach_send_enabled", 0)) === 1;
  if (outreachOn) {
    await fireAndForget("/api/outreach/send", { max: 3 });
    summary.outreachSend = "fired";
  }

  // ── 3. ONE heavy op per run, in priority order.

  // 3a. Recover drafts stuck in RESEARCHING (>15 min, e.g. a killed invocation).
  const { data: stuck } = await db
    .from("articles").select("id, regen_count")
    .eq("status", "RESEARCHING")
    .lt("updated_at", new Date(Date.now() - 15 * 60_000).toISOString())
    .limit(1);
  if (stuck && stuck.length && stuck[0].regen_count < 2) {
    await fireAndForget("/api/pipeline/draft", {
      articleId: stuck[0].id,
      feedback: "Previous attempt did not complete. Generate the full column now.",
    });
    summary.heavyOp = `recover-draft:${stuck[0].id}`;
    return NextResponse.json(summary);
  }

  // 3b. Gate any draft lacking a current report.
  const { data: ungated } = await db
    .from("articles").select("id")
    .eq("status", "DRAFTED").is("gate_report_json", null)
    .not("body_md", "is", null).limit(1);
  if (ungated && ungated.length) {
    await fireAndForget("/api/pipeline/gate", { articleId: ungated[0].id });
    summary.heavyOp = `gate:${ungated[0].id}`;
    return NextResponse.json(summary);
  }

  // 3c. One automatic regeneration after a first gate failure (spec 5.4).
  const { data: failed } = await db
    .from("articles").select("id, regen_count, gate_report_json")
    .eq("status", "GATED").limit(1);
  if (failed && failed.length && failed[0].regen_count < 2) {
    const failedChecks = (failed[0].gate_report_json?.checks ?? []).filter((c: { pass: boolean }) => !c.pass);
    await fireAndForget("/api/pipeline/draft", { articleId: failed[0].id, feedback: failedChecks });
    summary.heavyOp = `regen:${failed[0].id}`;
    return NextResponse.json(summary);
  }

  // 3d. Daily auto-selection: after the morning detect (05:00 KST), once per KST day.
  const { data: lastSel } = await db.from("app_settings").select("value").eq("key", "last_selection_date").maybeSingle();
  const lastSelDate = lastSel ? String(lastSel.value).replaceAll('"', "") : "";
  if (lastSelDate !== today && kstHour() >= 5) {
    const { count } = await db
      .from("stories").select("id", { count: "exact", head: true })
      .eq("status", "DETECTED")
      .gte("detected_at", new Date(Date.now() - 36 * 3600_000).toISOString());
    if ((count ?? 0) > 0) {
      await fireAndForget("/api/pipeline/select", {});
      summary.heavyOp = "auto-select";
      return NextResponse.json(summary);
    }
  }

  // 3e. Auto-accept: shortlist past the window and today's slots not filled.
  if (acceptMin > 0) {
    const { data: slots } = await db
      .from("articles").select("id")
      .eq("slot_date", today)
      .not("status", "in", "(REJECTED,KILLED)");
    const open = 3 - (slots ?? []).length;
    if (open > 0) {
      const cutoff = new Date(Date.now() - acceptMin * 60_000).toISOString();
      const { data: ripe } = await db
        .from("stories").select("id, headline, shortlisted_at")
        .eq("status", "SHORTLISTED")
        .not("shortlisted_at", "is", null)
        .lte("shortlisted_at", cutoff)
        .order("selection_score", { ascending: false })
        .limit(1);
      if (ripe && ripe.length) {
        await logEvent("story", ripe[0].id, "SHORTLISTED", "SELECTED", "system:auto-accept", {
          rule: `no editor action within ${acceptMin}m of shortlisting`,
        });
        await fireAndForget("/api/pipeline/draft", { storyId: ripe[0].id, slotDate: today });
        summary.heavyOp = `auto-accept-draft:${ripe[0].id}`;
        return NextResponse.json(summary);
      }
    }
  }

  // 3f. Auto-outreach: identify contacts for a recently published column that has none.
  if (outreachOn) {
    const { data: pub } = await db
      .from("articles").select("id")
      .eq("status", "PUBLISHED")
      .gte("published_at", new Date(Date.now() - 7 * 86400_000).toISOString())
      .order("published_at", { ascending: false }).limit(5);
    for (const a of pub ?? []) {
      const { count } = await db
        .from("contacts").select("id", { count: "exact", head: true }).eq("article_id", a.id);
      if ((count ?? 0) === 0) {
        await fireAndForget("/api/outreach/identify", { articleId: a.id });
        summary.heavyOp = `outreach-identify:${a.id}`;
        return NextResponse.json(summary);
      }
    }

    // 3g. Draft emails for eligible contacts that do not have one yet.
    const { data: pend } = await db
      .from("articles").select("id")
      .in("status", ["OUTREACH_PENDING", "OUTREACH_DRAFTED"])
      .order("published_at", { ascending: false }).limit(5);
    for (const a of pend ?? []) {
      const { data: cs } = await db
        .from("contacts").select("id, email, email_confidence, guess_opt_in")
        .eq("article_id", a.id).eq("suppressed", false);
      const eligible = (cs ?? []).filter(
        (c) => c.email && (c.email_confidence === "FOUND" || (c.email_confidence === "GUESSED" && c.guess_opt_in))
      );
      if (!eligible.length) continue;
      const ids = eligible.map((c) => c.id);
      const { data: have } = await db.from("outreach_emails").select("contact_id").in("contact_id", ids);
      const haveSet = new Set((have ?? []).map((h) => h.contact_id));
      if (eligible.some((c) => !haveSet.has(c.id))) {
        await fireAndForget("/api/outreach/draft", { articleId: a.id });
        summary.heavyOp = `outreach-draft:${a.id}`;
        return NextResponse.json(summary);
      }
    }
  }

  summary.heavyOp = null;
  return NextResponse.json(summary);
}
