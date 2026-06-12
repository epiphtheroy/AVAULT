import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getVaultArticles, getAllTags } from "@/lib/data";
import { ArticleCard } from "@/components/site/ArticleCard";

export const revalidate = 1800;
export const dynamicParams = true;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://avault.news";

export async function generateStaticParams() {
  const tags = await getAllTags();
  return tags.slice(0, 40).map((t) => ({ tag: t.tag }));
}

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }): Promise<Metadata> {
  const { tag } = await params;
  const t = decodeURIComponent(tag);
  return {
    title: `${t} — ethical verdicts and analysis`,
    description: `Every AVAULT verdict on ${t}: daily political-ethical judgments with concrete interventions, by Wonwoo Yoon.`,
    alternates: { canonical: `${siteUrl}/topic/${encodeURIComponent(t)}` },
  };
}

// Topic hub: topical-authority page per tag (SEO/GEO build, 2026-06-12).
export default async function TopicPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const t = decodeURIComponent(tag);
  const { articles, total } = await getVaultArticles({ tag: t, page: 1 });
  if (total === 0) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `AVAULT verdicts on ${t}`,
    url: `${siteUrl}/topic/${encodeURIComponent(t)}`,
    isPartOf: { "@type": "WebSite", name: "AVAULT", url: siteUrl },
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="border-b-2 border-rule-dark pb-2 flex items-baseline justify-between">
        <h1 className="font-sans text-sm font-bold uppercase tracking-[0.14em]">Topic: {t}</h1>
        <p className="text-xs text-ink-faint">{total} verdicts</p>
      </div>
      <p className="mt-3 font-serif text-[15px] text-ink-soft max-w-prose">
        Every verdict AVAULT has published on {t}: one owned political-ethical judgment and one
        concrete intervention per story, accumulated daily and checkable against how events unfolded.
      </p>
      <div className="mt-2">
        {articles.map((a) => (
          <ArticleCard key={a.id} article={a} kicker={t} />
        ))}
      </div>
      {total > 20 && (
        <p className="py-5 text-center">
          <Link href={`/vault?tag=${encodeURIComponent(t)}`} className="text-sm font-semibold text-accent">
            All {total} in The Vault →
          </Link>
        </p>
      )}
    </div>
  );
}
