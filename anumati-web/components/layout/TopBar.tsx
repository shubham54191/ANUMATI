import Link from "next/link";
import type { Meta } from "@/types/api";
import { ExplainToggle } from "@/components/ui/Explain";
import { ViewToggle } from "./ViewToggle";
import { VersionBanner } from "./VersionBanner";
import { SessionChip } from "./SessionChip";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/roadmap/new", label: "Roadmap", match: "roadmap", ready: true },
  { href: "/applications", label: "Applications", match: "applications", ready: false },
  { href: "/department", label: "Department", match: "department", ready: false },
  { href: "/rules", label: "Rules", match: "rules", ready: false },
  { href: "/standard", label: "Standard", match: "standard", ready: true },
];

function Mark() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="1" y="1" width="18" height="18" rx="2.5" stroke="var(--accent)" strokeWidth="1.5" />
      <rect x="5" y="5" width="10" height="1.6" fill="var(--accent)" />
      <rect x="5" y="9" width="7" height="1.6" fill="var(--accent-secondary)" />
      <rect x="5" y="13" width="4" height="1.6" fill="var(--accent)" />
    </svg>
  );
}

export function TopBar({ active, meta }: { active?: string; meta?: Meta }) {
  return (
    <header data-chrome className="flex h-14 flex-none items-center gap-7 border-b border-line bg-surface px-5">
      <Link href="/roadmap/new" className="flex items-center gap-2.5 no-underline">
        <Mark />
        <span className="text-sm font-semibold tracking-[0.16em] text-ink">ANUMATI</span>
        <span className="hidden rounded-sm bg-accent-muted px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wider text-accent lg:inline-block">
          OFFICIAL
        </span>
      </Link>

      <nav className="flex h-14 items-center gap-[22px]">
        {NAV.map((n) =>
          n.ready ? (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "flex h-14 items-center text-[13px] no-underline transition-colors",
                active === n.match
                  ? "font-semibold text-accent shadow-[inset_0_-2.5px_0_var(--accent)]"
                  : "text-muted hover:text-accent",
              )}
            >
              {n.label}
            </Link>
          ) : (
            <span
              key={n.href}
              title="Designed, not built yet"
              aria-disabled="true"
              className="flex h-14 cursor-default items-center gap-1.5 text-[13px] text-faint"
            >
              {n.label}
              <span className="h-[3px] w-[3px] rounded-full bg-line-strong" />
            </span>
          ),
        )}
      </nav>

      <div className="flex-1" />
      <ViewToggle />
      <ExplainToggle className="flex-none" />
      {meta ? <VersionBanner meta={meta} /> : null}
      <SessionChip />
    </header>
  );
}
