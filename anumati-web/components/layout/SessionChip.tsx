"use client";
import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

/**
 * Who is signed in, and the way out.
 *
 * The name is capped and truncated: an applicant is a registered company, and
 * "Sahyadri Agro Foods Pvt Ltd" was wrapping onto three lines and shoving the
 * rest of the bar off screen.
 */
export function SessionChip() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);

  if (!session) return null;

  return (
    <div className="flex flex-none items-center gap-2 border-l border-db-line pl-3">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-db-blue-tint">
        <UserRound className="h-4 w-4 text-db-blue" strokeWidth={1.8} />
      </span>

      <div className="hidden max-w-[132px] leading-tight xl:block">
        <div className="truncate text-[12.5px] font-medium text-db-ink" title={session.name}>
          {session.name}
        </div>
        <div className="truncate text-[11px] text-db-muted">{session.designation}</div>
      </div>

      <button
        onClick={() => {
          signOut();
          router.replace("/login");
        }}
        title="Sign out"
        aria-label="Sign out"
        className="flex h-8 w-8 flex-none items-center justify-center rounded-lg text-db-faint transition-colors hover:bg-db-bg hover:text-db-red"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.7} />
      </button>
    </div>
  );
}
