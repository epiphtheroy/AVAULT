import type { Metadata } from "next";
import Link from "next/link";
import { getVaultArticles } from "@/lib/data";
import { ArticleCard } from "@/components/site/ArticleCard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The Vault — every verdict, archived",
  description:
    "The complete archive of AVAULT verdicts: daily political-ethical judgments, filterable by topic and intervention type, checkable against how events unfolded.",
};

const INTERVENTIONS = ["legislation", "regulation", "market design", "governance", "civic action", "media practice", "personal ethics"];

export default async function VaultPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string; intervention?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = parseInt(sp.page ?? "1", 10) || 1;
  const { articles, total } = await getVaultArticles({
    q: sp.q, tag: sp.tag, intervention: sp.intervention, page,
  });
  const pages = Math.max(1, Math.ceil(total / 20));

  return (
    <div className="mx-auto max-w-3xl px-4 pt-6">
      <div className="border-b-2 border-rule-dark pb-2 flex items-baseline justify-between">
        <h1 className="font-sans text-sm font-bold tracking-[0.14em] uppercase">The Vault</h1>
        <p className="text-xs text-ink-faint">{total} verdicts</p>
      </div>

      <form className="mt-4 flex flex-wrap gap-2" action="/vault" method="get">
        <input
          type="search"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search the archive"
          className="flex-1 min-w-44 border border-rule bg-paper px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <select
          name="intervention"
          defaultValue={sp.intervention ?? ""}
          className="border border-rule bg-paper px-2 py-2 text-sm"
        >
          <option value="">All interventions</option>
          {INTERVENTIONS.map((i) => (
            <option key={i} value={i}>{i}</option>
          ))}
        </select>
        <button type="submit" className="bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-accent transition-colors">
          Filter
        </button>
      </form>

      {sp.tag && (
        <p className="mt-3 text-sm text-ink-soft">
          Topic: <span className="font-semibold">{sp.tag}</span>{" "}
          <Link href="/vault" className="text-accent">clear</Link>
        </p>
      )}

      <div className="mt-2">
        {articles.length === 0 ? (
          <p className="py-10 text-center text-sm text-ink-faint">No verdicts match. The Vault grows daily.</p>
        ) : (
          articles.map((a) => <ArticleCard key={a.id} article={a} />)
        )}
      </div>

      {pages > 1 && (
        <nav className="flex justify-center gap-2 py-6 text-sm font-semibold">
          {page > 1 && (
            <Link className="text-accent" href={`/vault?${qs({ ...sp, page: String(page - 1) })}`}>← Newer</Link>
          )}
          <span className="text-ink-faint">{page} / {pages}</span>
          {page < pages && (
            <Link className="text-accent" href={`/vault?${qs({ ...sp, page: String(page + 1) })}`}>Older →</Link>
          )}
        </nav>
      )}
    </div>
  );
}

function qs(params: Record<string, string | undefined>): string {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) u.set(k, v);
  return u.toString();
}
