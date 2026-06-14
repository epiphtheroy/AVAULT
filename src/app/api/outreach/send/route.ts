import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { logEvent } from "@/lib/pipeline";
import { sendGmail, gmailConfigured } from "@/lib/gmail";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

// Phase 2 — send (spec 5.8), Gmail API implementation.
// Safety rails kept from the spec even though the editor enabled full-auto send (2026-06-14):
//   - master switch app_settings.outreach_send_enabled (0 = off, default) — nothing sends until set to 1
//   - daily cap (daily_email_cap) with warm-up (warmup_daily_cap until warmup_until)
//   - per-invocation throttle (`max`, default 3) so the 5-min heartbeat spreads sends over hours
//   - never send to a suppressed contact or an identifier on the suppression list
//   - only FOUND emails, or GUESSED with explicit per-recipient opt-in (spec 5.6 hard rule)
//   - a single reply of "no more emails" is honored by adding the address to suppression_list

function jval(v: unknown): string {
  return typeof v === "string" ? v.replaceAll('"', "") : String(v);
}

async function setting(
  db: ReturnType<typeof supabaseAdmin>,
  key: string,
  fallback: number
): Promise<number> {
  const { data } = await db.from("app_settings").select("value").eq("key", key).maybeSingle();
  const n = data ? Number(jval(data.value)) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

function parseDraft(draftText: string): { subject: string; body: string } {
  const m = draftText.match(/^Subject:\s*(.*?)\r?\n\r?\n([\s\S]*)$/);
  if (m) return { subject: m[1].trim(), body: m[2].trim() };
  return { subject: "A note from Wonwoo Yoon", body: draftText.trim() };
}

interface ContactRow {
  id: string;
  article_id: string;
  name: string;
  email: string | null;
  email_confidence: "FOUND" | "GUESSED" | "MISSING";
  guess_opt_in: boolean;
  suppressed: boolean;
}

export async function POST(req: Request) {
  const { ok } = await requireAdmin(req);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  if (!gmailConfigured()) {
    return NextResponse.json(
      {
        error: "gmail not configured",
        need: ["OUTREACH_FROM", "GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN"],
      },
      { status: 503 }
    );
  }

  let body: { max?: number; force?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    /* no body */
  }

  const db = supabaseAdmin();

  // Master switch. `force: true` lets the admin send a manual batch even while auto is off.
  const enabled = (await setting(db, "outreach_send_enabled", 0)) === 1;
  if (!enabled && !body.force) {
    return NextResponse.json({ sent: 0, reason: "outreach_send_enabled is 0" });
  }

  // Effective daily cap (warm-up aware).
  const dailyCap = await setting(db, "daily_email_cap", 30);
  const warmupCap = await setting(db, "warmup_daily_cap", 10);
  const { data: warmRow } = await db
    .from("app_settings").select("value").eq("key", "warmup_until").maybeSingle();
  const warmUntil = warmRow ? jval(warmRow.value) : "null";
  const inWarmup = warmUntil !== "null" && warmUntil !== "" && new Date() < new Date(warmUntil);
  const cap = inWarmup ? warmupCap : dailyCap;

  // Sent so far in the current UTC day.
  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const { count: sentToday } = await db
    .from("outreach_emails").select("id", { count: "exact", head: true })
    .eq("status", "SENT").gte("sent_at", dayStart.toISOString());

  const remaining = Math.max(0, cap - (sentToday ?? 0));
  const perRun = Math.min(remaining, Math.max(1, body.max ?? 3));
  if (remaining <= 0) {
    return NextResponse.json({ sent: 0, reason: "daily cap reached", cap, sentToday: sentToday ?? 0 });
  }

  // Suppression list (emails / handles, lowercased).
  const { data: supp } = await db.from("suppression_list").select("identifier");
  const suppressedSet = new Set((supp ?? []).map((s) => s.identifier.toLowerCase()));

  // Sendable drafts, oldest first. DRAFTED is sendable under full-auto; APPROVED also honored.
  const { data: candidates } = await db
    .from("outreach_emails")
    .select(
      "id, draft_text, status, contact_id, contacts(id, article_id, name, email, email_confidence, guess_opt_in, suppressed)"
    )
    .in("status", ["DRAFTED", "APPROVED"])
    .order("created_at", { ascending: true })
    .limit(perRun * 5);

  let sent = 0;
  const errors: string[] = [];
  const touchedArticles = new Set<string>();

  for (const e of candidates ?? []) {
    if (sent >= perRun) break;
    const c = e.contacts as unknown as ContactRow | null;
    if (!c || c.suppressed || !c.email) continue;
    const eligible =
      c.email_confidence === "FOUND" || (c.email_confidence === "GUESSED" && c.guess_opt_in);
    if (!eligible) continue;
    if (suppressedSet.has(c.email.toLowerCase())) continue;

    const { subject, body: emailBody } = parseDraft(e.draft_text);
    try {
      const msgId = await sendGmail({ to: c.email, subject, body: emailBody });
      await db
        .from("outreach_emails")
        .update({
          status: "SENT",
          sent_at: new Date().toISOString(),
          delivery_status: `gmail:${msgId}`,
        })
        .eq("id", e.id);
      await logEvent("outreach_email", e.id, e.status, "SENT", "system:auto-send", {
        to: c.email,
        article_id: c.article_id,
      });
      touchedArticles.add(c.article_id);
      sent++;
    } catch (err) {
      errors.push(`${c.email}: ${(err as Error).message}`);
    }
  }

  // Advance article status to SENT for any article we just emailed from.
  for (const articleId of touchedArticles) {
    await db
      .from("articles")
      .update({ status: "SENT" })
      .eq("id", articleId)
      .in("status", ["OUTREACH_PENDING", "OUTREACH_DRAFTED", "OUTREACH_APPROVED"]);
  }

  return NextResponse.json({
    sent,
    cap,
    inWarmup,
    sentToday: (sentToday ?? 0) + sent,
    errors,
  });
}
