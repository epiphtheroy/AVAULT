import type { Metadata } from "next";
import { getReopenings } from "@/lib/data";
import { ArticleCard } from "@/components/site/ArticleCard";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "The Reopening — verdicts revisited",
  description:
    "Once a week, AVAULT reopens a past verdict against subsequent events: what held, what didn't, what the author got wrong. Self-correction in public.",
};

export default async function ReopeningPage() {
  const reopenings = await getReopenings();
  return (
    <div className="mx-auto max-w-3xl px-4 pt-6">
      <div className="border-b-2 border-rule-dark pb-2">
        <h1 className="font-sans text-sm font-bold tracking-[0.14em] uppercase">The Reopening</h1>
      </div>
      <p className="mt-4 font-serif text-[15px] text-ink-soft max-w-prose">
        Judgments are kept, then re-examined. Once a week, one slot revisits a past verdict
        against what actually happened: what held, what didn&apos;t, and what I got wrong.
        An archive you can check is the only authority worth having.
      </p>
      <div className="mt-4">
        {reopenings.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-faint">
            No reopenings yet. The first verdicts must age before they can be judged.
          </p>
        ) : (
          reopenings.map((a) => <ArticleCard key={a.id} article={a} kicker="The Reopening" />)
        )}
      </div>
    </div>
  );
}
