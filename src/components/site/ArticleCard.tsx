import Link from "next/link";
import type { Article } from "@/lib/types";

export function dateLabel(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", timeZone: "America/New_York",
  });
}

/** Compact YouTube play badge shown when an article carries a verified related video. */
export function YouTubeBadge({ className = "h-5 w-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 20" className={className} aria-label="Related video on YouTube" role="img">
      <rect width="28" height="20" rx="4.5" fill="#FF0000" />
      <path d="M11.5 5.5 L19 10 L11.5 14.5 Z" fill="#ffffff" />
    </svg>
  );
}

export function ArticleCard({ article, kicker }: { article: Article; kicker?: string }) {
  return (
    <article className="row-rule flex items-start justify-between gap-4 py-5">
      <Link href={`/article/${article.url_slug}`} className="group min-w-0 flex-1">
        <p className="kicker">{kicker ?? article.topic_tags?.[0] ?? "Vault"}</p>
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
      {article.youtube_json?.url && (
        <Link
          href={`/article/${article.url_slug}#watch`}
          className="relative mt-7 block shrink-0"
          title="Watch the related video"
          aria-label="Watch the related video"
        >
          {article.youtube_json.thumbnail ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.youtube_json.thumbnail}
                alt=""
                loading="lazy"
                className="h-14 w-24 border border-rule object-cover transition-opacity hover:opacity-85 sm:h-[4.5rem] sm:w-32"
              />
              <span className="absolute bottom-1 right-1 drop-shadow">
                <YouTubeBadge className="h-3.5 w-5" />
              </span>
            </>
          ) : (
            <YouTubeBadge />
          )}
        </Link>
      )}
    </article>
  );
}
