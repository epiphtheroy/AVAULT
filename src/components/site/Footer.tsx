import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-16 border-t-2 border-rule-dark bg-paper-warm">
      <div className="mx-auto max-w-3xl px-4 py-8 text-[13px] text-ink-soft">
        <p className="font-semibold text-ink">AVAULT</p>
        <p className="mt-1 max-w-prose">
          The personal studio of Wonwoo Yoon. Three political-ethical verdicts on the
          day&apos;s biggest news, every day. AI-assisted, human-judged: every published
          word is reviewed and owned by the author.
        </p>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
          <Link href="/vault" className="hover:text-accent">The Vault</Link>
          <Link href="/methodology" className="hover:text-accent">Methodology</Link>
          <Link href="/about" className="hover:text-accent">About</Link>
          <Link href="/contact" className="hover:text-accent">Contact</Link>
          <a href="/rss.xml" className="hover:text-accent">RSS</a>
        </div>
        <p className="mt-4 text-ink-faint">
          © {new Date().getFullYear()} Wonwoo Yoon · AVAULT
        </p>
      </div>
    </footer>
  );
}
