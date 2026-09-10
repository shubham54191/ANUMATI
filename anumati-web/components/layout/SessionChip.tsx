"use client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

/** Who is signed in, and the way out. */
export function SessionChip() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const signOut = useAuthStore((s) => s.signOut);

  if (!session) return null;

  return (
    <div className="flex items-center gap-2.5 border-l border-line pl-[18px]">
      <div className="hidden text-right leading-tight lg:block">
        <div className="text-[12px] font-medium text-ink">{session.name}</div>
        <div className="font-mono text-[10px] tracking-[0.04em] text-faint">{session.designation}</div>
      </div>
      <button
        onClick={() => {
          signOut();
          router.replace("/login");
        }}
        title="Sign out"
        aria-label="Sign out"
        className="flex h-7 w-7 items-center justify-center rounded border border-line text-muted transition-colors hover:border-accent hover:text-accent"
      >
        <LogOut className="h-3 w-3" strokeWidth={1.5} />
      </button>
    </div>
  );
}
