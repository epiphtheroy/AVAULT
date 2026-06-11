import { supabaseAdmin } from "./supabase/server";
import type { DigestEntry } from "./types";

/** Audit log: every state transition (spec Section 8, events table). */
export async function logEvent(
  entityType: "story" | "article" | "contact" | "outreach_email" | "system",
  entityId: string | null,
  fromStatus: string | null,
  toStatus: string | null,
  actor: string,
  payload?: Record<string, unknown>
) {
  const db = supabaseAdmin();
  await db.from("events").insert({
    entity_type: entityType,
    entity_id: entityId,
    from_status: fromStatus,
    to_status: toStatus,
    actor,
    payload: payload ?? null,
  });
}

export async function getRecentDigest(): Promise<DigestEntry[]> {
  const db = supabaseAdmin();
  const { data } = await db.from("recent_digest").select("*");
  return (data as DigestEntry[]) ?? [];
}

/** Remove web-search citation markers and leading duplicates of headline/deck/summary
 *  that models sometimes embed in body_md. */
export function cleanDraft(draft: {
  headline: string; deck: string; summary_line: string; body_md: string;
}): { headline: string; deck: string; summary_line: string; body_md: string } {
  const strip = (s: string) =>
    (s ?? "")
      .replace(/<\/?cite[^>]*>/g, "")
      .replace(/<\/?antml[^>]*>/g, "")
      .trim();

  const headline = strip(draft.headline).replace(/^#+\s*/, "");
  const deck = strip(draft.deck);
  const summary_line = strip(draft.summary_line).replace(/^\*+/, "").replace(/\*+$/, "").trim();

  let body = strip(draft.body_md);
  const norm = (s: string) => s.replace(/[#*_>\s]+/g, " ").trim().toLowerCase();
  const dupes = new Set([norm(headline), norm(deck), norm(summary_line)]);

  // Drop leading blocks that duplicate the headline, deck, or summary line.
  const blocks = body.split(/\n{2,}/);
  let i = 0;
  while (i < blocks.length && i < 4 && dupes.has(norm(blocks[i]))) i++;
  body = blocks.slice(i).join("\n\n").trim();

  return { headline, deck, summary_line, body_md: body };
}

export function slugify(headline: string): string {
  return headline
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function readingTime(bodyMd: string): number {
  const words = bodyMd.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function firstLine(bodyMd: string): string {
  const para = bodyMd
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith("#") && !l.startsWith("|") && !l.startsWith("**The") );
  return (para ?? "").replace(/\*\*/g, "").slice(0, 300);
}

export function lastLine(bodyMd: string): string {
  // Last non-empty paragraph before a Sources section, if any.
  const withoutSources = bodyMd.split(/\n#{1,3}\s*Sources/i)[0];
  const paras = withoutSources
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
  return (paras[paras.length - 1] ?? "").replace(/\*\*/g, "").slice(0, 300);
}

/** Cron/API auth: require CRON_SECRET via Authorization header or Vercel cron header. */
export function authorizeCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}
