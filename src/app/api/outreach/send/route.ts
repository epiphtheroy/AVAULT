import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Phase 2 — send (spec 5.8). DELIBERATE STUB until the dedicated sending subdomain
// (mail.avault…) exists with SPF/DKIM/DMARC and a transactional provider is connected.
// HUMAN GATE: when implemented, this route must require per-email approval status
// ('APPROVED' set by Wonwoo in the Outreach Manager), enforce the daily cap (30; warm-up 10),
// throttle over hours, and never send to suppressed identifiers. Auto-send must remain impossible.
export async function POST() {
  const { ok, actor } = await requireAdmin();
  if (!ok || actor !== "wonwoo") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  return NextResponse.json(
    {
      error: "sending not yet enabled",
      todo: [
        "configure dedicated subdomain (e.g., mail.avault.news) with SPF/DKIM/DMARC",
        "connect transactional provider (Resend/Postmark) via OUTREACH_* env vars",
        "respect warm-up ramp: first 2 weeks ≤10/day, then cap 30/day",
        "throttle sends over hours; record delivery webhooks; auto-suppress bounces/opt-outs",
      ],
    },
    { status: 501 }
  );
}
