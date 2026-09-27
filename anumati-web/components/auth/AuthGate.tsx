"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, type Role } from "@/store/useAuthStore";

/** Where each role lands. Each role is kept inside its own product. */
export const HOME: Record<Role, string> = {
  officer: "/matrix",
  applicant: "/roadmap/new",
  committee: "/committee",
  reviewer: "/rules",
  admin: "/matrix",
};

/**
 * Keeps each role inside its own product. An officer who lands on the
 * applicant roadmap is sent to the console: the 34-approval roadmap, the
 * sequential-versus-parallel arithmetic and the reform simulator are the
 * applicant's side of the counter, and putting them in front of the person
 * processing the file is just noise on their screen.
 *
 * In live mode this is a convenience only: the server enforces the same
 * boundary on every request, so a page that slipped past this gate would get
 * nothing back.
 */
export function AuthGate({ allow, children }: { allow: Role | Role[]; children: React.ReactNode }) {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const allowed = Array.isArray(allow) ? allow : [allow];
  const ok = Boolean(session && (session.role === "admin" || allowed.includes(session.role)));

  useEffect(() => hydrate(), [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    if (!session) {
      router.replace("/login");
      return;
    }
    if (!ok) router.replace(HOME[session.role]);
  }, [hydrated, session, ok, router]);

  if (!hydrated || !ok) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <span className="font-mono text-[11px] tracking-[0.1em] text-faint">CHECKING SESSION…</span>
      </div>
    );
  }

  return <>{children}</>;
}
