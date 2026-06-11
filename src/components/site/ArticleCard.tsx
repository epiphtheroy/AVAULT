import Link from "next/link";
import type { Article } from "@/lib/types";

export function dateLabel(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York",
  });
}

export function ArticleCard({ article, kicker }: { article: Article; kicker?: string }) {
  return (
    <article className="row-rule py-5">
      <Link href={`/article/${article.url_slug}`} className="group block">
        <p className="kicker">{kicker ?? article.topic_tags?.[0] ?? "Verdict"}</p>
        <h2 className="hed mt-1.5 text-[22px] sm:text-2xl group-hover:text-accent transition-colors">
          {article.headline}
        </h2>
        {article.deck && (
          <p className="mt-2 text-[15px] leading-snug text-ink-soft font-serif">{article.deck}</p>
        )}
        <p className="mt-2.5 text-xs text-ink-faint">
          {dateLabel(article.published_at)}
          {article.reading_time_min ? ` · ${article.reading_time_min} min read` : ""}
          {article.is_reopening ? " · The Reopening" : ""}
        </p>
      </Link>
    </article>
  );
}
