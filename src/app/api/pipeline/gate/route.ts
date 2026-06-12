import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { callClaude, extractJson, utilityModel } from "@/lib/anthropic";
import { gatePrompt } from "@/lib/prompts";
import { logEvent } from "@/lib/pipeline";
import type { GateReport, SourceRef } from "@/lib/types";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

// Automated gate (spec 5.4): second model pass, pass/fail per check with quoted evidence.
// Failures route back to one regeneration; two consecutive failures flag manual edit.
export async function POST(req: Request) {
  const { ok, actor } = await requireAdmin(req);
  if (!ok) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { articleId } = await req.json();
  if (!articleId) return NextResponse.json({ error: "articleId required" }, { status: 400 });

  const db = supabaseAdmin();
  const { data: article } = await db.from("articles").select("*").eq("id", articleId).single();
  if (!article?.body_md) return NextResponse.json({ error: "no draft to gate" }, { status: 404 });

  const model = utilityModel();
  const result = await callClaude({
    prompt: gatePrompt(
      {
        headline: article.headline,
        deck: article.deck,
        summary_line: article.summary_line,
        body_md: article.body_md,
        sources: (article.sources_json as SourceRef[]) ?? [],
      },
      null
    ),
    model,
    maxTokens: 4000,
  });

  const parsed = extractJson<{ pass: boolean; checks: GateReport["checks"] }>(result.text);
  const report: GateReport = {
    pass: parsed.pass && parsed.checks.every((c) => c.pass),
    checks: parsed.checks,
    checked_at: new Date().toISOString(),
    model,
  };

  const newStatus = report.pass ? "IN_REVIEW" : article.regen_count >= 1 ? "IN_REVIEW" : "GATED";
  // pass → IN_REVIEW; first fail → GATED (client offers one regeneration with the report injected);
  // second fail → IN_REVIEW flagged for manual edit (spec: two consecutive failures → manual).

  await db.from("articles").update({
    gate_report_json: report,
    status: newStatus,
    // Start the auto-publish review window only for gate-passed drafts.
    review_requested_at: report.pass && newStatus === "IN_REVIEW" ? new Date().toISOString() : null,
  }).eq("id", articleId);
  await logEvent("article", articleId, article.status, newStatus, actor === "wonwoo" ? actor : model, {
    pass: report.pass,
    failed: report.checks.filter((c) => !c.pass).map((c) => c.name),
  });

  return NextResponse.json({ articleId, pass: report.pass, status: newStatus, report });
}
