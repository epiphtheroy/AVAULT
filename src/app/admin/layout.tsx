import Link from "next/link";
import { Wordmark } from "@/components/site/Wordmark";
import { LogoutButton } from "@/components/admin/LogoutButton";

const nav = [
  { href: "/admin", label: "Pipeline" },
  { href: "/admin/desk", label: "Story Desk" },
  { href: "/admin/outreach", label: "Outreach" },
  { href: "/admin/analytics", label: "Analytics" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-paper-warm">
      <header className="bg-ink text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-white">
              <Wordmark className="h-4" />
            </Link>
            <nav className="flex gap-4 text-[13px] font-semibold">
              {nav.map((n) => (
                <Link key={n.href} href={n.href} className="text-white/80 hover:text-white">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4 text-[12px]">
            <Link href="/" className="text-white/60 hover:text-white">View site →</Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
