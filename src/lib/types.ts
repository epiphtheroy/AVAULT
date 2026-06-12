export type PipelineStatus =
  | "DETECTED" | "SHORTLISTED" | "SELECTED" | "RESEARCHING" | "DRAFTED" | "GATED"
  | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "OUTREACH_PENDING" | "OUTREACH_DRAFTED"
  | "OUTREACH_APPROVED" | "SENT" | "TRACKING" | "REJECTED" | "KILLED";

export const PIPELINE_ORDER: PipelineStatus[] = [
  "DETECTED", "SHORTLISTED", "SELECTED", "RESEARCHING", "DRAFTED", "GATED",
  "IN_REVIEW", "APPROVED", "PUBLISHED", "OUTREACH_PENDING", "OUTREACH_DRAFTED",
  "OUTREACH_APPROVED", "SENT", "TRACKING",
];

export interface Story {
  id: string;
  cluster_id: string | null;
  outlet: string;
  url: string;
  headline: string;
  byline: string | null;
  published_at: string | null;
  summary: string | null;
  status: PipelineStatus;
  selection_score: number | null;
  selection_rationale: string | null;
  slot_date: string | null;
  detected_at: string;
  ko_review_md: string | null;
  shortlisted_at: string | null;
}

export interface SourceRef {
  title: string;
  outlet: string;
  url: string;
}

export interface Article {
  id: string;
  story_id: string | null;
  slot_date: string | null;
  headline: string | null;
  deck: string | null;
  summary_line: string | null;
  body_md: string | null;
  opening_line: string | null;
  closing_line: string | null;
  sources_json: SourceRef[];
  theorists_json: string[];
  intervention_type: string | null;
  topic_tags: string[];
  status: PipelineStatus;
  gate_report_json: GateReport | null;
  regen_count: number;
  reading_time_min: number | null;
  url_slug: string | null;
  scheduled_for: string | null;
  published_at: string | null;
  is_reopening: boolean;
  flagged_for_reopening: boolean;
  ko_review_md: string | null;
  review_requested_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  faq_json: { q: string; a: string }[];
  social_json: { x: string; linkedin: string } | null;
  youtube_json: { url: string; title: string; thumbnail?: string } | null;
  created_at: string;
  updated_at: string;
}

export interface GateCheck {
  name: string;
  pass: boolean;
  evidence: string;
}

export interface GateReport {
  pass: boolean;
  checks: GateCheck[];
  checked_at: string;
  model: string;
}

export interface Contact {
  id: string;
  article_id: string;
  name: string;
  role: string | null;
  why_relevant: string;
  email: string | null;
  email_source_url: string | null;
  email_confidence: "FOUND" | "GUESSED" | "MISSING";
  guess_opt_in: boolean;
  x_handle: string | null;
  suppressed: boolean;
  suppression_reason: string | null;
  rank: number | null;
}

export interface OutreachEmail {
  id: string;
  contact_id: string;
  draft_text: string;
  status: "DRAFTED" | "APPROVED" | "REJECTED" | "SENT" | "BOUNCED" | "REPLIED" | "OPTED_OUT";
  approved_at: string | null;
  sent_at: string | null;
  delivery_status: string | null;
  replied_at: string | null;
  reply_text: string | null;
}

export interface DigestEntry {
  headline: string | null;
  opening_line: string | null;
  closing_line: string | null;
  theorists_json: string[];
  intervention_type: string | null;
  published_at: string | null;
}
