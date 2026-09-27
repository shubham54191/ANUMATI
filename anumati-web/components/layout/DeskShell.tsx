"use client";
import Link from "next/link";
import { useAuthStore, type Role } from "@/store/useAuthStore";
import { ModeBadge } from "./ModeBadge";
import { SessionChip } from "./SessionChip";
import { cn } from "@/lib/utils";

const LINKS: { href: string; label: string; match: string; roles: Role[] }[] = [
  { href: "/matrix", label: "Clearance Console", match: "matrix", roles: ["officer", "committee", "admin"] },
  { href: "/committee", label: "Committee", match: "committee", roles: ["committee", "admin"] },
  { href: "/rules", label: "Rule review", match: "rules", roles: ["reviewer", "admin"] },
  { href: "/standard", label: "Standard", match: "standard", roles: ["officer", "committee", "reviewer", "admin"] },
];

/** Chrome for the government-side desks that are not the clearance console. */
export function DeskShell({ active, children }: { active: string; children: React.ReactNode }) {
  const role = useAuthStore((s) => s.session?.role);
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-db-bg">
      <header data-chrome className="flex h-14 flex-none items-center gap-4 overflow-hidden border-b border-db-line bg-surface px-5">
        <span className="text-sm font-semibold tracking-[0.16em] text-db-ink">ANUMATI</span>
        <nav className="flex min-w-0 flex-1 items-center gap-5 overflow-x-auto">
          {LINKS.filter((l) => role && l.roles.includes(role)).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex h-14 flex-none items-center whitespace-nowrap text-[13px] no-underline transition-colors",
                active === l.match ? "font-semibold text-db-blue shadow-[inset_0_-2px_0_var(--db-blue)]" : "text-db-muted hover:text-db-ink",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <ModeBadge className="hidden flex-none md:inline-flex" />
        <SessionChip />
      </header>
      <main id="main" className="min-h-0 flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
