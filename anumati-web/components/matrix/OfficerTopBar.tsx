"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ChevronDown, Clock, FileText, LogOut, UserRound } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { useMatrixStore } from "@/store/useMatrixStore";
import { derive } from "@/lib/matrix/engine";
import { cn } from "@/lib/utils";

function Mark() {
  return (
    <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-db-amber-tint">
      <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden>
        <rect x="1" y="1" width="18" height="18" rx="4" stroke="var(--db-amber)" strokeWidth="1.6" />
        <rect x="5" y="5.5" width="10" height="1.7" rx="0.85" fill="var(--db-amber)" />
        <rect x="5" y="9.2" width="7" height="1.7" rx="0.85" fill="var(--db-amber-strong)" />
        <rect x="5" y="12.9" width="4" height="1.7" rx="0.85" fill="var(--db-amber)" />
      </svg>
    </span>
  );
}

function StatusChip({
  Icon,
  tile,
  value,
  label,
  emphatic,
}: {
  Icon: typeof Clock;
  tile: string;
  value: number;
  label: string;
  emphatic?: boolean;
}) {
  return (
    <span className="flex h-9 items-center gap-2 rounded-full border border-db-line bg-surface pl-1.5 pr-3.5">
      <span className={cn("flex h-6 w-6 flex-none items-center justify-center rounded-full", tile)}>
        <Icon className="h-3.5 w-3.5" strokeWidth={1.9} />
      </span>
      <span className={cn("whitespace-nowrap text-[12.5px]", emphatic ? "text-db-red" : "text-db-muted")}>
        <span className={cn("font-semibold", !emphatic && "text-db-ink")}>{value}</span> {label}
      </span>
    </span>
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
      className="flex h-16 flex-none items-center gap-6 border-b border-db-line bg-surface px-5"
    >
      <div className="flex flex-none items-center gap-2.5">
        <Mark />
        <span className="text-[15px] font-semibold tracking-[0.14em] text-db-ink">ANUMATI</span>
        <span className="hidden rounded-full bg-db-blue-tint px-2.5 py-1 text-[10.5px] font-semibold tracking-[0.06em] text-db-blue sm:inline-block">
          MATRIX 2.0
        </span>
      </div>

      <nav className="flex h-16 flex-none items-center gap-6">
        <span className="flex h-16 items-center text-[14px] font-semibold text-db-ink shadow-[inset_0_-2px_0_var(--db-blue)]">
          Clearance Console
        </span>
        <Link
          href="/standard"
          className="flex h-16 items-center text-[14px] text-db-muted no-underline transition-colors hover:text-db-ink"
        >
          Standard
        </Link>
      </nav>

      <div className="flex-1" />

      <div className="hidden items-center gap-2.5 xl:flex">
        <StatusChip
          Icon={FileText}
          tile="bg-db-green-tint text-db-green"
          value={open.length}
          label={`Open file${open.length === 1 ? "" : "s"}`}
        />
        <StatusChip
          Icon={AlertCircle}
          tile={conflicts > 0 ? "bg-db-red-tint text-db-red" : "bg-db-bg text-db-faint"}
          value={conflicts}
          label="in conflict"
          emphatic={conflicts > 0}
        />
        <StatusChip
          Icon={Clock}
          tile={breaches > 0 ? "bg-db-amber-tint text-db-amber" : "bg-db-bg text-db-faint"}
          value={breaches}
          label="past SLA"
        />
      </div>

      <div className="flex flex-none items-center gap-2.5 border-l border-db-line pl-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-db-blue-tint">
          <UserRound className="h-[18px] w-[18px] text-db-blue" strokeWidth={1.8} />
        </span>
        <div className="hidden leading-tight md:block">
          <div className="text-[13px] font-semibold text-db-ink">{session?.name}</div>
          <div className="text-[11.5px] text-db-muted">{session?.designation ?? "Officer"}</div>
        </div>
        <ChevronDown className="hidden h-4 w-4 text-db-faint md:block" strokeWidth={1.7} />
        <button
          onClick={() => {
            signOut();
            router.replace("/login");
          }}
          title="Sign out"
          aria-label="Sign out"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-db-faint transition-colors hover:bg-db-bg hover:text-db-red"
        >
          <LogOut className="h-4 w-4" strokeWidth={1.7} />
        </button>
      </div>
    </header>
  );
}
