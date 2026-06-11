import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import type { Article, Contact, OutreachEmail } from "@/lib/types";
import { ActionButton } from "@/components/admin/ActionButton";

export const dynamic = "force-dynamic";

// Outreach Manager (spec 6.4) — Phase 2 skeleton over live DB. Sending stays disabled
// until the dedicated subdomain + provider exist (api/outreach/send returns 501).
export default async function OutreachManager({
  searchParams,
}: {
  searchParams: Promise<{ article?: string }>;
}) {
  const sp = await searchParams;
  const db = await supabaseServer();

  const { data: articlesData } = await db
    .from("articles")
    .select("*")
    .not("published_at", "is", null)
    .order("published_at", { ascending: false })
    .limit(30);
  const articles = (articlesData ?? []) as Article[];
  const selected = sp.article ? articles.find((a) => a.id === sp.article) : articles[0];

  let contacts: Contact[] = [];
  let emails: Record<string, OutreachEmail> = {};
  if (selected) {
    const { data: c } = await db.from("contacts").select("*").eq("article_id", selected.id).order("rank");
    contacts = (c ?? []) as Contact[];
    if (contacts.length) {
      const { data: e } = await db.from("outreach_emails").select("*").in("contact_id", contacts.map((x) => x.id));
      for (const em of (e ?? []) as OutreachEmail[]) emails[em.contact_id] = em;
    }
  }

  const { data: suppression } = await db.from("suppression_list").select("*").order("added_at", { ascending: false }).limit(10);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-rule-dark pb-2">
        <h1 className="font-sans text-sm font-bold uppercase tracking-[0.14em]">Outreach Manager</h1>
        <p className="text-[12px] text-ink-faint">
          Phase 2: sending activates once mail.avault subdomain + provider are configured. Cap 30/day, warm-up 10/day.
        </p>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[260px_1fr]">
        {/* Article picker */}
        <div className="space-y-1.5">
          <h2 className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">Published columns</h2>
          {articles.map((a) => (
            <Link key={a.id} href={`/admin/outreach?article=${a.id}`}
              className={`block border p-2.5 text-[13px] leading-snug ${selected?.id === a.id ? "border-ink bg-paper" : "border-rule bg-paper-warm hover:border-ink"}`}>
              <span className="font-semibold line-clamp-2">{a.headline}</span>
              <span className="mt-1 block text-[11px] text-ink-faint">{a.status}</span>
            </Link>
          ))}
          {articles.length === 0 && <p className="text-[13px] text-ink-faint">Nothing published yet.</p>}
        </div>

        {/* Contacts + drafts */}
        <div>
          {selected ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="hed text-lg">{selected.headline}</h2>
                <div className="flex gap-2">
                  <ActionButton endpoint="/api/outreach/identify" payload={{ articleId: selected.id }}
                    label="Identify targets (≤10)" busyLabel="Searching (1–3 min)…" variant="primary" />
                  <ActionButton endpoint="/api/outreach/draft" payload={{ articleId: selected.id }}
                    label="Draft emails" busyLabel="Drafting…" variant="accent" />
                </div>
              </div>

              <div className="mt-3 space-y-3">
                {contacts.length === 0 && (
                  <p className="border border-dashed border-rule p-6 text-center text-[13px] text-ink-faint">
                    No contacts yet. Run target identification on this column.
                  </p>
                )}
                {contacts.map((c) => {
                  const email = emails[c.id];
                  return (
                    <div key={c.id} className={`border p-3.5 ${c.suppressed ? "border-rule opacity-60" : "border-rule bg-paper"}`}>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="text-[14px] font-bold">
                          {c.rank ? `#${c.rank} ` : ""}{c.name}
                          <span className="ml-2 text-[12px] font-normal text-ink-soft">{c.role}</span>
                        </p>
                        <p className="text-[11px] font-bold">
                          <span className={
                            c.email_confidence === "FOUND" ? "text-green-700"
                            : c.email_confidence === "GUESSED" ? "text-amber-600" : "text-ink-faint"
                          }>
                            {c.email_confidence}
                          </span>
                          {c.suppressed && <span className="ml-2 text-accent">SUPPRESSED</span>}
                        </p>
                      </div>
                      <p className="mt-1 text-[13px] text-ink-soft">{c.why_relevant}</p>
                      <p className="mt-1 text-[12px] text-ink-faint">
                        {c.email ?? c.x_handle ?? "no public contact"}
                        {c.email_source_url && (
                          <> · <a className="underline hover:text-accent" href={c.email_source_url} target="_blank" rel="noopener">source</a></>
                        )}
                      </p>
                      {email && (
                        <details className="mt-2 border-t border-rule pt-2">
                          <summary className="cursor-pointer text-[12px] font-bold">
                            Draft · {email.status}
                          </summary>
                          <pre className="mt-2 whitespace-pre-wrap bg-paper-warm p-3 font-serif text-[13px] leading-relaxed">{email.draft_text}</pre>
                          <p className="mt-2 text-[11px] text-ink-faint">
                            Approve/send controls activate with the sending provider (Phase 2).
                          </p>
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-[13px] text-ink-faint">Publish a column first; outreach runs on published columns.</p>
          )}

          <div className="mt-8 border-t-2 border-rule-dark pt-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">Suppression list (latest 10)</h3>
            <ul className="mt-2 space-y-1 text-[12px] text-ink-soft">
              {(suppression ?? []).map((s) => (
                <li key={s.id}>{s.identifier} · {s.reason} · {new Date(s.added_at).toLocaleDateString()}</li>
              ))}
              {(suppression ?? []).length === 0 && <li className="text-ink-faint">Empty.</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
