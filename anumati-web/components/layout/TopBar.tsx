import Link from "next/link";
import { ChevronDown, UserRound } from "lucide-react";
import type { Meta } from "@/types/api";
import { ViewToggle } from "./ViewToggle";
import { VersionBanner } from "./VersionBanner";
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

/**
 * `variant="board"` is the Project Roadmap chrome: the context line rides next
 * to the wordmark and the right-hand side is the account chip, because the
 * board carries its own role switch and its own rule-version line.
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
      className={cn(
        "flex h-14 flex-none items-center gap-6 border-b bg-surface px-6",
        board ? "border-db-line" : "border-line",
      )}
    >
      <Link href="/roadmap/new" className="flex flex-none items-center gap-2.5 no-underline">
        <Mark />
        <span className="text-sm font-semibold tracking-[0.16em] text-db-ink">ANUMATI</span>
      </Link>

      {board && subtitle ? (
        <>
          <span className="h-5 w-px flex-none bg-db-line" />
          <span className="hidden truncate text-[13px] text-db-muted xl:block">{subtitle}</span>
        </>
      ) : null}

      <div className="flex-1" />

      <nav className="flex h-14 items-center gap-5">
        <span className="hidden rounded-full bg-db-blue-tint px-2.5 py-1 text-[11px] font-semibold tracking-[0.04em] text-db-blue lg:inline-block">
          Official
        </span>
        {NAV.map((n) =>
          n.ready ? (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "flex h-14 items-center text-[13px] no-underline transition-colors",
                active === n.match
                  ? "font-semibold text-db-blue shadow-[inset_0_-2px_0_var(--db-blue)]"
                  : "text-db-muted hover:text-db-ink",
              )}
            >
              {n.label}
            </Link>
          ) : (
            <span
              key={n.href}
              title="Designed, not built yet"
              aria-disabled="true"
              className="flex h-14 cursor-default items-center gap-1.5 text-[13px] text-db-faint"
            >
              {n.label}
              <span className="h-[3px] w-[3px] rounded-full bg-db-line" />
            </span>
          ),
        )}
      </nav>

      {board ? (
        <span className="flex h-9 flex-none items-center gap-2 rounded-lg border border-db-line px-3 text-[12.5px] text-db-muted">
          <UserRound className="h-4 w-4 text-db-faint" strokeWidth={1.7} />
          Demo
          <ChevronDown className="h-3.5 w-3.5 text-db-faint" strokeWidth={1.7} />
        </span>
      ) : (
        <>
          <ViewToggle />
          {meta ? <VersionBanner meta={meta} /> : null}
        </>
      )}
    </header>
  );
}
