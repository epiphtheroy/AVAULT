import type { Metadata } from "next";
import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://avault.news";

export const metadata: Metadata = {
  title: "Methodology — how AVAULT is made",
  description:
    "The operating constitution of AVAULT: mandatory research, steelmanned objections, a defamation firewall, disclosed AI assistance, and human approval on every publish and every email.",
  alternates: { canonical: `${siteUrl}/methodology` },
};

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-6">
      <div className="border-b-2 border-rule-dark pb-2">
        <h1 className="font-sans text-sm font-bold tracking-[0.14em] uppercase">Methodology</h1>
      </div>

      <div className="prose-avault mt-6 max-w-prose">
        <p>
          <strong>AVAULT is one human&apos;s judgment, produced in a studio that uses AI as an
          instrument.</strong> This page is the publication&apos;s operating constitution. It is
          a standing commitment, not a disclaimer.
        </p>

        <h2>The operating constitution</h2>
        <ol>
          <li>
            Research is mandatory for every column. Sources are cited. A column that merely
            restates its source article is a failed column.
          </li>
          <li>
            The strongest objection to the verdict is engaged in every column, at its strongest
            form, and answered honestly. What must be conceded is conceded.
          </li>
          <li>
            Criticism targets structures, institutions, and actions. It never targets the
            character of private individuals. This rule has no exceptions.
          </li>
          <li>
            AI assistance is disclosed. AVAULT uses Claude Fable 5 (Anthropic) as a research
            and drafting instrument. Story selection standards, editorial judgment, every edit,
            and every decision to publish belong to Wonwoo Yoon, who reviews and owns every
            published word.
          </li>
          <li>
            Corrections and re-examinations are published openly in{" "}
            <Link href="/reopening">The Reopening</Link>: a weekly revisiting of past verdicts
            against how events actually unfolded.
          </li>
          <li>
            No undisclosed automation anywhere AVAULT appears. The publication does not post to
            comment sections, does not run bot accounts, and does not automate anything that
            conceals its nature.
          </li>
        </ol>

        <h2>How a column is made</h2>
        <p>
          Each day, candidate stories from authoritative outlets are collected and ranked. The
          author selects three. For each, the studio performs a close reading of the source,
          independent research beyond it, and a decomposition of the issue into layers that
          deserve different moral evaluations. The column takes one position and proposes a
          concrete intervention with an identifiable implementing agent.
        </p>
        <p>
          Drafts pass an automated quality gate that checks, among other things: that research
          added at least one fact absent from the source; that the strongest objection was
          engaged; that no unverified factual assertion about any person appears; and that no
          private individual&apos;s character is attacked. Every gate-passed draft then enters
          the author&apos;s review queue, where he edits, approves, or kills it. Approval is
          given explicitly, or by a standing editorial rule after a fixed review window passes
          with no objection. Either way, the standards are his and the responsibility is his.
        </p>

        <h2>How AVAULT grows</h2>
        <p>
          Two channels: search, and short personal notes to the journalists and scholars whose
          work each column engages. Every such email is individually reviewed and approved by
          the author before sending, uses only publicly available professional contact
          information, never exceeds one note per person per column, and honors a single
          &quot;no more emails&quot; permanently. There are no automated follow-ups.
        </p>
        <p>
          The standing rule beneath all of it: every growth mechanism must itself survive the
          ethical scrutiny this publication applies to the world.
        </p>
      </div>
      <div className="h-10" />
    </div>
  );
}
