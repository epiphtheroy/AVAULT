import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getArticleBySlug, getRelatedArticles, getAllPublishedSlugs } from "@/lib/data";
import { mdToHtml } from "@/lib/markdown";
import { dateLabel } from "@/components/site/ArticleCard";
import type { SourceRef } from "@/lib/types";

export const revalidate = 3600;
export const dynamicParams = true;

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://avault.news";

export async function generateStaticParams() {
  const slugs = await getAllPublishedSlugs();
  return slugs.slice(0, 50).map((s) => ({ slug: s.url_slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Not found" };
  // Search surfaces get the normative long-tail title; social/OG keep the literary headline.
  return {
    title: article.seo_title ?? article.headline ?? undefined,
    description: article.seo_description ?? article.deck ?? article.summary_line ?? undefined,
    alternates: { canonical: `${siteUrl}/article/${slug}` },
    openGraph: {
      title: article.headline ?? undefined,
      description: article.deck ?? undefined,
      type: "article",
      publishedTime: article.published_at ?? undefined,
      authors: ["Wonwoo Yoon"],
      url: `${siteUrl}/article/${slug}`,
    },
    twitter: { card: "summary_large_image", title: article.headline ?? undefined, description: article.deck ?? undefined },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article || !article.body_md) notFound();

  const related = await getRelatedArticles(article);
  const sources = (article.sources_json as SourceRef[]) ?? [];
  const url = `${siteUrl}/article/${slug}`;

  // NewsArticle JSON-LD with author → Person entity (spec Section 7, non-negotiable).
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.headline,
    alternativeHeadline: article.seo_title ?? undefined,
    description: article.seo_description ?? article.deck,
    abstract: article.summary_line ?? undefined,
    datePublished: article.published_at,
    dateModified: article.updated_at,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    articleSection: article.topic_tags?.[0] ?? undefined,
    author: {
      "@type": "Person",
      name: "Wonwoo Yoon",
      url: `${siteUrl}/about`,
      jobTitle: "Critic and writer",
      sameAs: [`${siteUrl}/about`],
    },
    publisher: {
      "@type": "Organization",
      name: "AVAULT",
      url: siteUrl,
      logo: { "@type": "ImageObject", "@id": `${siteUrl}/icon.svg` },
    },
    isAccessibleForFree: true,
    keywords: (article.topic_tags ?? []).join(", "),
    speakable: { "@type": "SpeakableSpecification", cssSelector: [".summary-line"] },
  };

  const faq = (article.faq_json ?? []) as { q: string; a: string }[];
  const faqLd = faq.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

  return (
    <article className="mx-auto max-w-3xl px-4 pt-7">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      )}

      <header>
        <p className="kicker">
          {article.is_reopening ? "The Reopening" : article.topic_tags?.[0] ?? "Vault"}
        </p>
        <h1 className="hed mt-2 text-[28px] sm:text-4xl">{article.headline}</h1>
        {article.deck && (
          <p className="mt-3 font-serif text-lg leading-snug text-ink-soft">{article.deck}</p>
        )}
        <div className="mt-4 flex items-center justify-between border-y border-rule py-2.5 text-xs text-ink-faint">
          <p>
            By{" "}
            <Link href="/about" className="font-semibold text-ink hover:text-accent" rel="author">
              Wonwoo Yoon
            </Link>
            {" · "}{dateLabel(article.published_at)}
            {article.reading_time_min ? ` · ${article.reading_time_min} min read` : ""}
          </p>
          <ShareLinks url={url} headline={article.headline ?? ""} />
        </div>
      </header>

      {article.summary_line && (
        <p className="summary-line mt-5 font-serif text-[17px] font-bold leading-relaxed">
          {article.summary_line}
        </p>
      )}

      <div
        className="prose-avault mt-5"
        dangerouslySetInnerHTML={{ __html: mdToHtml(stripSourcesSection(article.body_md)) }}
      />

      {article.youtube_json?.url && (() => {
        const vid = article.youtube_json.url.match(/v=([A-Za-z0-9_-]{11})/)?.[1];
        if (!vid) return null;
        return (
          <section id="watch" className="mt-8 scroll-mt-16 border-t border-rule pt-4">
            <h2 className="font-sans text-xs font-bold tracking-[0.14em] uppercase">Watch</h2>
            <div className="mt-3 aspect-video w-full bg-ink">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${vid}`}
                title={article.youtube_json.title}
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
              />
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-[12px] text-ink-faint">
              <svg viewBox="0 0 28 20" className="h-3.5 w-5 shrink-0" aria-hidden="true">
                <rect width="28" height="20" rx="4.5" fill="#FF0000" />
                <path d="M11.5 5.5 L19 10 L11.5 14.5 Z" fill="#ffffff" />
              </svg>
              {article.youtube_json.title}
            </p>
          </section>
        );
      })()}

      {faq.length > 0 && (
        <section className="mt-8 border-t border-rule pt-4">
          <h2 className="font-sans text-xs font-bold tracking-[0.14em] uppercase">Questions this verdict answers</h2>
          <div className="mt-2 space-y-3">
            {faq.map((f, i) => (
              <div key={i}>
                <p className="font-serif text-[15px] font-bold">{f.q}</p>
                <p className="mt-1 font-serif text-[15px] leading-relaxed text-ink-soft">{f.a}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {(article.topic_tags ?? []).length > 0 && (
        <p className="mt-6 flex flex-wrap gap-2 text-[12px]">
          {article.topic_tags.map((t) => (
            <Link key={t} href={`/topic/${encodeURIComponent(t)}`}
              className="border border-rule px-2 py-0.5 text-ink-soft hover:border-ink hover:text-ink">
              {t}
            </Link>
          ))}
        </p>
      )}

      {sources.length > 0 && (
        <section className="mt-8 border-t border-rule pt-4">
          <h2 className="font-sans text-xs font-bold tracking-[0.14em] uppercase">Sources</h2>
          <ul className="mt-2 space-y-1.5 text-[13px] text-ink-soft">
            {sources.map((s, i) => (
              <li key={i}>
                <a href={s.url} rel="noopener nofollow" target="_blank" className="hover:text-accent">
                  {s.title}
                </a>{" "}
                <span className="text-ink-faint">— {s.outlet}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Author block (E-E-A-T) */}
      <section className="mt-10 bar-top bg-paper-warm p-5">
        <p className="font-sans text-sm font-bold">Wonwoo Yoon</p>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-soft max-w-prose">
          Seoul-based critic and writer. AVAULT is his studio: one political-ethical verdict
          at a time, on the day&apos;s most important news, with AI assistance that is openly
          disclosed. Every published word is reviewed and owned by the author.
        </p>
        <Link href="/about" className="mt-2 inline-block text-[13px] font-semibold text-accent">
          About the studio →
        </Link>
      </section>

      {related.length > 0 && (
        <section className="mt-10">
          <div className="border-b-2 border-rule-dark pb-2">
            <h2 className="font-sans text-sm font-bold tracking-[0.14em] uppercase">Related in The Vault</h2>
          </div>
          {related.map((r) => (
            <p key={r.id} className="row-rule py-3.5">
              <Link href={`/article/${r.url_slug}`} className="hed text-[17px] hover:text-accent">
                {r.headline}
              </Link>
            </p>
          ))}
        </section>
      )}

      <div className="h-10" />
    </article>
  );
}

function stripSourcesSection(md: string): string {
  // Sources render from structured data; avoid duplicating a trailing Sources block
  // (either a "## Sources" header or a "**Sources:**" signpost).
  return md.split(/\n(?:#{1,3}\s*|\*\*)Sources\b/i)[0];
}

function ShareLinks({ url, headline }: { url: string; headline: string }) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(headline);
  return (
    <span className="flex gap-3 font-semibold">
      <a href={`https://x.com/intent/post?text=${t}&url=${u}`} rel="noopener" target="_blank" className="hover:text-accent">X</a>
      <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${u}`} rel="noopener" target="_blank" className="hover:text-accent">In</a>
      <a href={`mailto:?subject=${t}&body=${u}`} className="hover:text-accent">✉</a>
    </span>
  );
}
