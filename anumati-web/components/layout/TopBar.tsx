import Link from "next/link";
import type { Meta } from "@/types/api";
import { ExplainToggle } from "@/components/ui/Explain";
import { VersionBanner } from "./VersionBanner";
import { SessionChip } from "./SessionChip";
import { ModeBadge } from "./ModeBadge";
import { isLive } from "@/lib/api/client";
import { cn } from "@/lib/utils";

/**
 * Only destinations that exist. Three greyed-out words that do nothing when a
 * judge clicks them cost more than the breadth they imply, and they were most
 * of the text in this bar.
 */
const NAV = [
  { href: "/roadmap/new", label: "Roadmap", match: "roadmap" },
  // Filed applications exist only where there is a server to file them with.
  ...(isLive() ? [{ href: "/applications", label: "My applications", match: "applications" }] : []),
  { href: "/standard", label: "Standard", match: "standard" },
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

/**
 * One row, and it must never overflow.
 *
 * The rule: the subtitle is the only flexible child (`min-w-0 flex-1 truncate`),
 * so a long project name eats its own words instead of pushing the nav and the
 * account chip off the right edge. Everything else is `flex-none`.
 *
 * `variant="board"` is the Project Roadmap chrome. It does NOT carry the role
 * switch or the rule-version line: the board header owns the first and the
 * board footer prints the second, and having both here was showing every
 * applicant the same two facts twice.
 */
export function TopBar({
  active,
  meta,
  variant = "default",
  subtitle,
}: {
  active?: string;
  meta?: Meta;
  variant?: "default" | "board";
  subtitle?: string;
}) {
  const board = variant === "board";

  return (
    <header
      data-chrome
      className="flex h-14 flex-none items-center gap-4 overflow-hidden border-b border-db-line bg-surface px-5"
    >
      <Link
        href="/roadmap/new"
        className="flex flex-none items-center gap-2.5 no-underline"
        title="ANUMATI"
      >
        <Mark />
        <span className="text-sm font-semibold tracking-[0.16em] text-db-ink">ANUMATI</span>
      </Link>

      <span className="hidden rounded-full bg-db-blue-tint px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] text-db-blue lg:inline-block">
        Official
      </span>

      {board && subtitle ? (
        <>
          <span className="hidden h-5 w-px flex-none bg-db-line md:block" />
          <span className="hidden min-w-0 flex-1 truncate text-[13px] text-db-muted md:block">
            {subtitle}
          </span>
        </>
      ) : (
        <div className="min-w-0 flex-1" />
      )}

      <nav className="flex flex-none items-center gap-5">
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={cn(
              "flex h-14 items-center whitespace-nowrap text-[13px] no-underline transition-colors",
              active === n.match
                ? "font-semibold text-db-blue shadow-[inset_0_-2px_0_var(--db-blue)]"
                : "text-db-muted hover:text-db-ink",
            )}
          >
            {n.label}
          </Link>
        ))}
      </nav>

      <ModeBadge className="hidden flex-none md:inline-flex" />

      <ExplainToggle className="flex-none" />

      {/* The rule-version line is already printed under the board. It stays in
          the bar only on screens that are not carrying it, and only when wide. */}
      {meta && !board ? (
        <span className="hidden 2xl:block">
          <VersionBanner meta={meta} />
        </span>
      ) : null}

      <SessionChip />
    </header>
  );
}
