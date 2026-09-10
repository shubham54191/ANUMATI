"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock, ShieldCheck, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Card";
import { useAuthStore } from "@/store/useAuthStore";
import { cn } from "@/lib/utils";

const HOME: Record<string, string> = {
  officer: "/matrix",
  applicant: "/roadmap/new",
};

function Mark() {
  return (
    <svg width="28" height="28" viewBox="0 0 20 20" fill="none" aria-hidden>
      <rect x="1" y="1" width="18" height="18" rx="2.5" stroke="var(--accent)" strokeWidth="1.5" />
      <rect x="5" y="5" width="10" height="1.6" fill="var(--accent)" />
      <rect x="5" y="9" width="7" height="1.6" fill="var(--accent-secondary)" />
      <rect x="5" y="13" width="4" height="1.6" fill="var(--accent)" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const signIn = useAuthStore((s) => s.signIn);
  const signInAsApplicant = useAuthStore((s) => s.signInAsApplicant);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => hydrate(), [hydrate]);
  useEffect(() => {
    if (hydrated && session) router.replace(HOME[session.role]);
  }, [hydrated, session, router]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = signIn(username, password);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);
    router.replace(HOME[username.trim().toLowerCase() === "officer" ? "officer" : "applicant"]);
  };

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Left — what the thing is. An officer signing in at 9am should not have
          to remember which of six portals this one was. */}
      <div className="hidden w-[46%] flex-col justify-between border-r border-line bg-surface px-12 py-10 lg:flex">
        <div className="flex items-center gap-3">
          <Mark />
          <span className="text-[15px] font-semibold tracking-[0.16em] text-ink">ANUMATI</span>
          <span className="rounded-sm bg-accent-muted px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-wider text-accent">
            OFFICIAL
          </span>
        </div>

        <div className="max-w-[420px]">
          <h1 className="font-serif text-[34px] font-medium leading-[1.15] text-ink">
            Every approval, in the order the law requires.
          </h1>
          <p className="mt-4 text-[13.5px] leading-relaxed text-muted">
            Applicants see the roadmap — what is needed, what waits on what, and
            where the days go. Officers see the other half: files pushed to every
            department at once, the clocks running against each of them, and the
            rule that decides who wins when two departments disagree.
          </p>

          <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-5">
            {[
              ["Concurrent routing", "One file, every department, same instant"],
              ["Escalation matrix", "SLA breach lifts the file a tier by itself"],
              ["Deemed approval", "A silent non-critical desk stops blocking"],
              ["Conflict protocol", "Veto, tie-breaker or weighted score"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="label mb-1 block">{k}</dt>
                <dd className="text-[12.5px] leading-snug text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="font-mono text-[11px] text-faint">
          Rules v1.3 · engine 8f31c04 · Government of Maharashtra — demonstration build
        </p>
      </div>

      {/* Right — the form. */}
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-[380px]">
          <div className="mb-7 flex items-center gap-3 lg:hidden">
            <Mark />
            <span className="text-[15px] font-semibold tracking-[0.16em] text-ink">ANUMATI</span>
          </div>

          <h2 className="font-serif text-[26px] font-medium leading-tight text-ink">Sign in</h2>
          <p className="mt-1.5 text-[13px] text-muted">
            Departmental users sign in with the credential issued by their
            single-window office.
          </p>

          <form onSubmit={submit} className="mt-7 flex flex-col gap-4" noValidate>
            <div>
              <Label className="mb-1.5 block" id="user-label">
                User id
              </Label>
              <div className="flex h-11 items-center gap-2.5 rounded border border-control bg-surface px-3 focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-1">
                <User className="h-3.5 w-3.5 flex-none text-faint" strokeWidth={1.5} />
                <input
                  aria-labelledby="user-label"
                  autoComplete="username"
                  autoCapitalize="characters"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="OFFICER"
                  className="w-full bg-transparent font-mono text-[13.5px] tracking-[0.04em] text-ink outline-none placeholder:font-sans placeholder:tracking-normal placeholder:text-faint"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1.5 block" id="pass-label">
                Password
              </Label>
              <div className="flex h-11 items-center gap-2.5 rounded border border-control bg-surface px-3 focus-within:ring-2 focus-within:ring-accent focus-within:ring-offset-1">
                <Lock className="h-3.5 w-3.5 flex-none text-faint" strokeWidth={1.5} />
                <input
                  aria-labelledby="pass-label"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full bg-transparent font-mono text-[13.5px] tracking-[0.04em] text-ink outline-none placeholder:text-faint"
                />
              </div>
            </div>

            {error ? (
              <p
                role="alert"
                className={cn(
                  "rounded border border-critical/40 bg-critical/[0.05] px-3 py-2",
                  "text-[12.5px] leading-snug text-critical",
                )}
              >
                {error}
              </p>
            ) : null}

            <Button type="submit" variant="primary" size="md" className="mt-1 w-full">
              Sign in
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.6} />
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-line" />
            <span className="label">or</span>
            <span className="h-px flex-1 bg-line" />
          </div>

          <Button
            size="md"
            className="w-full"
            onClick={() => {
              signInAsApplicant();
              router.replace("/roadmap/new");
            }}
          >
            Continue as an applicant
          </Button>

          <div className="mt-7 rounded border border-line bg-sunk px-3.5 py-3">
            <div className="mb-2 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
              <Label>Demonstration accounts</Label>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-[11.5px]">
              <dt className="text-faint">OFFICER / ADMIN</dt>
              <dd className="text-ink">Single-window officer — Matrix 2.0 console</dd>
              <dt className="text-faint">APPLICANT / DEMO</dt>
              <dd className="text-ink">Applicant — approval roadmap</dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
