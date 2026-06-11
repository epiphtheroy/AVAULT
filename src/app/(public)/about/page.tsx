import type { Metadata } from "next";
import Link from "next/link";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://avault.news";

export const metadata: Metadata = {
  title: "About — Wonwoo Yoon and the studio",
  description:
    "AVAULT is the personal studio of Wonwoo Yoon, a Seoul-based critic and writer: daily political-ethical verdicts on the day's most important news.",
  alternates: { canonical: `${siteUrl}/about` },
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    mainEntity: {
      "@type": "Person",
      name: "Wonwoo Yoon",
      url: `${siteUrl}/about`,
      jobTitle: "Critic and writer",
      description: "Seoul-based critic and writer; author and sole human editor of AVAULT.",
      worksFor: { "@type": "Organization", name: "AVAULT", url: siteUrl },
    },
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="border-b-2 border-rule-dark pb-2">
        <h1 className="font-sans text-sm font-bold tracking-[0.14em] uppercase">About</h1>
      </div>

      <div className="prose-avault mt-6 max-w-prose">
        <h2>The author</h2>
        <p>
          <strong>Wonwoo Yoon</strong> is a critic and writer based in Seoul. AVAULT is his
          studio and his byline: every column published here is his judgment, argued in his
          voice, and he is accountable for every word of it.
        </p>
        <p>
          This is one person learning the world in public. Each day, three of the world&apos;s
          most consequential stories pass through the same discipline: separate the facts from
          the frame, find the issue beneath the reaction, take a position, and propose something
          an identifiable agent could actually do. Confident in the argument, honest about
          uncertainty.
        </p>

        <h2>The name</h2>
        <p>
          A vault is where things of value are kept. Each day&apos;s judgments are deposited
          here, dated, and never quietly rewritten. The archive, naturally, is called{" "}
          <Link href="/vault">The Vault</Link>. To vault is also to leap over: in this case,
          over the noise.
        </p>

        <h2>The studio</h2>
        <p>
          AVAULT is a one-person media operation assisted by AI, and says so plainly. The
          author uses Claude (Anthropic) as a research and drafting instrument; he selects the
          stories, sets the standards, edits the drafts, and nothing is published or sent
          without his explicit approval. The full method is documented on the{" "}
          <Link href="/methodology">Methodology</Link> page.
        </p>
        <p>
          Its authority rests on three things: a real, named, accountable author; a transparent
          and verifiable method; and an accumulating archive of judgments that can be checked
          against how events unfolded, including openly in <Link href="/reopening">The Reopening</Link>.
        </p>

        <h2>Contact</h2>
        <p>
          Replies, objections, and corrections are welcome: <Link href="/contact">Contact</Link>.
          The strongest objection to any verdict is the one this publication most wants to hear.
        </p>
      </div>
      <div className="h-10" />
    </div>
  );
}
