import Link from "next/link";
import { getLatestArticles } from "@/lib/data";
import { ArticleCard, dateLabel } from "@/components/site/ArticleCard";

export const revalidate = 300;

export default async function HomePage() {
  const latest = await getLatestArticles(12);
  const today = latest.slice(0, 3);
  const earlier = latest.slice(3);

  return (
    <div className="mx-auto max-w-3xl px-4">
      {/* The opening ritual: the vault opens once a day. */}
      <section className="pt-6">
        <div className="flex items-baseline justify-between border-b-2 border-rule-dark pb-2">
          <h1 className="font-sans text-sm font-bold tracking-[0.14em] uppercase">
            Today&apos;s vault
          </h1>
          <p className="text-xs text-ink-faint">
            {today[0]?.published_at ? dateLabel(today[0].published_at) : "The vault opens at 6:00 a.m. ET"}
          </p>
        </div>

        {today.length === 0 ? (
          <div className="bar-top mt-6 bg-paper-warm p-6">
            <p className="hed text-xl">The vault has not yet opened.</p>
            <p className="mt-2 text-sm text-ink-soft max-w-prose">
              Every day at 6:00 a.m. ET, AVAULT releases three political-ethical verdicts
              on the day&apos;s most important news: one owned judgment and one concrete
              intervention per story. Until then, the archive is open.
            </p>
            <Link href="/vault" className="mt-3 inline-block text-sm font-semibold text-accent">
              Enter The Vault →
            </Link>
          </div>
        ) : (
          <div>
            {today.map((a, i) => (
              <ArticleCard key={a.id} article={a} kicker={`Vault ${i + 1}`} />
            ))}
          </div>
        )}
      </section>

      {earlier.length > 0 && (
        <section className="mt-10">
          <div className="border-b-2 border-rule-dark pb-2">
            <h2 className="font-sans text-sm font-bold tracking-[0.14em] uppercase">
              From The Vault
            </h2>
          </div>
          <div>
            {earlier.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
          <p className="py-6 text-center">
            <Link href="/vault" className="text-sm font-semibold text-accent">
              All verdicts →
            </Link>
          </p>
        </section>
      )}

      {/* Positioning strip */}
      <section className="my-10 border-y border-rule py-5">
        <p className="font-serif text-[15px] leading-relaxed text-ink-soft max-w-prose">
          For readers tired of shallow hot takes and evasive both-sides-ism: a defensible
          ethical judgment and an actionable intervention on the day&apos;s biggest stories,
          in five minutes, every day, from one named author.{" "}
          <Link href="/methodology" className="text-accent font-semibold">How it&apos;s made →</Link>
        </p>
      </section>
    </div>
  );
}
