"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, type Role } from "@/store/useAuthStore";

const HOME: Record<Role, string> = {
  officer: "/matrix",
  applicant: "/roadmap/new",
};

/**
 * Keeps each role inside its own product. An officer who lands on the
 * applicant roadmap is sent to the console: the 34-approval roadmap, the
 * sequential-versus-parallel arithmetic and the reform simulator are the
 * applicant's side of the counter, and putting them in front of the person
 * processing the file is just noise on their screen.
 */
export function AuthGate({ allow, children }: { allow: Role; children: React.ReactNode }) {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => hydrate(), [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (session.role !== allow) router.replace(HOME[session.role]);
  }, [hydrated, session, allow, router]);

  if (!hydrated || !session || session.role !== allow) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <span className="font-mono text-[11px] tracking-[0.1em] text-faint">CHECKING SESSION…</span>
      </div>
    );
  }

  return <>{children}</>;
}
