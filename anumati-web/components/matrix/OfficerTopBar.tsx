"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useMatrixStore } from "@/store/useMatrixStore";
import { derive } from "@/lib/matrix/engine";
import { cn } from "@/lib/utils";

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
 * The officer's chrome. Deliberately not the applicant's: no roadmap, no
 * sequential-versus-parallel arithmetic, no reform simulator. An officer opens
 * this to work a queue, and everything here is either a file or a clock.
 */
export function OfficerTopBar() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);
  const applications = useMatrixStore((s) => s.applications);

  const open = applications.filter((a) => !a.resolution);
  const conflicts = applications.filter((a) => derive(a).conflict && !a.resolution).length;
  const breaches = applications.reduce((n, a) => n + derive(a).breachedSla.length, 0);

  return (
    <header
      data-chrome
      className="flex h-14 flex-none items-center gap-6 border-b border-line bg-surface px-5"
    >
      <div className="flex items-center gap-2.5">
        <Mark />
        <span className="text-sm font-semibold tracking-[0.16em] text-ink">ANUMATI</span>
        <span className="rounded-sm bg-accent-muted px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wider text-accent">
          MATRIX 2.0
        </span>
      </div>

      <span className="h-[18px] w-px bg-line" />

      <nav className="flex items-center gap-5 text-[13px]">
        <span className="font-semibold text-accent">Clearance console</span>
        <Link href="/standard" className="text-muted no-underline transition-colors hover:text-accent">
          Standard
        </Link>
      </nav>

      <div className="flex-1" />

      <div className="hidden items-center gap-4 font-mono text-[11px] md:flex">
        <span className="text-muted">
          {open.length} open file{open.length === 1 ? "" : "s"}
        </span>
        <span className={cn(conflicts > 0 ? "font-medium text-critical" : "text-muted")}>
          {conflicts} in conflict
        </span>
        <span className={cn(breaches > 0 ? "font-medium text-state-deemed-ink" : "text-muted")}>
          {breaches} past SLA
        </span>
      </div>

      <span className="h-[18px] w-px bg-line" />

      <div className="flex items-center gap-3">
        <div className="text-right leading-tight">
          <div className="text-[12.5px] font-medium text-ink">{session?.name}</div>
          <div className="font-mono text-[10px] tracking-[0.04em] text-faint">
            {session?.username} · {session?.designation}
          </div>
        </div>
        <button
          onClick={() => {
            signOut();
            router.replace("/login");
          }}
          title="Sign out"
          aria-label="Sign out"
          className="flex h-8 w-8 items-center justify-center rounded border border-line text-muted transition-colors hover:border-accent hover:text-accent"
        >
          <LogOut className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
