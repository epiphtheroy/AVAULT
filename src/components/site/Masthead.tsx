import Link from "next/link";
import { Wordmark } from "./Wordmark";

const nav = [
  { href: "/", label: "Today" },
  { href: "/vault", label: "The Vault" },
  { href: "/reopening", label: "The Reopening" },
  { href: "/methodology", label: "Methodology" },
  { href: "/about", label: "About" },
];

export function Masthead() {
  return (
    <header>
      {/* Red masthead block, Economist-style */}
      <div className="bg-accent">
        <div className="mx-auto max-w-3xl px-4 py-4 sm:py-5">
          <Link href="/" className="inline-block text-white">
            <Wordmark className="h-7 sm:h-9" />
          </Link>
          <p className="mt-1 text-[11px] font-medium tracking-[0.18em] uppercase text-white/85">
            A vault for judgment · One verdict at a time
          </p>
        </div>
      </div>
      <nav className="border-b border-rule bg-paper sticky top-0 z-40">
        <div className="mx-auto max-w-3xl px-4 overflow-x-auto">
          <ul className="flex gap-5 text-[13px] font-semibold whitespace-nowrap">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block py-2.5 text-ink hover:text-accent transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
