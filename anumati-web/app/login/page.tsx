"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  Building2,
  ClipboardCheck,
  Gavel,
  Loader2,
  MapPin,
  Network,
  Radar,
  Timer,
  UserRound,
} from "lucide-react";
import { AnumatiMark } from "@/components/brand/AnumatiMark";
import { PlantScene } from "@/components/brand/PlantScene";
import { StateEmblem } from "@/components/brand/StateEmblem";
import { useAuthStore, type EntryRole } from "@/store/useAuthStore";
import { HOME } from "@/components/auth/AuthGate";
import { ModeBadge } from "@/components/layout/ModeBadge";
import { isLive } from "@/lib/api/client";


const ACRONYM = ["Approvals", "Navigation", "Unified", "Monitoring", "For", "All", "Industries"];

const PILLARS = [
  { Icon: Timer, line1: "Faster", line2: "Approvals" },
  { Icon: Network, line1: "Better", line2: "Coordination" },
  { Icon: Radar, line1: "Real-time", line2: "Tracking" },
  { Icon: BarChart3, line1: "Data-Driven", line2: "Decisions" },
];

/**
 * The four ways in.
 *
 * Nobody arriving here has been given a password, so nobody is asked for one.
 * Each card signs in and opens that role's own product; the server still
 * decides what the role may do once it is inside.
 */
const ENTRY: { role: EntryRole; Icon: typeof Timer; title: string; line: string }[] = [
  {
    role: "applicant",
    Icon: Building2,
    title: "I am setting up a unit",
    line: "Your approval roadmap, what to file when, and a check before you file",
  },
  {
    role: "officer",
    Icon: ClipboardCheck,
    title: "I am a facilitation officer",
    line: "The clearance console — dispatch, conflicts, SLA clocks, the data matrix",
  },
  {
    // The last two desks write to the server, so they exist only when there is
    // one. Offline they are left off the screen rather than offered and then
    // refused — a card that leads nowhere is worse than a card that is absent.
    role: "committee",
    Icon: Gavel,
    title: "I am on the Empowered Committee",
    line: "Files transferred under s. 5 and grievances raised under s. 8",
  },
  {
    role: "reviewer",
    Icon: UserRound,
    title: "I review the rule base",
    line: "Drafts waiting for a named sign-off before they go live",
  },
];

/** The brand curve that sweeps across the foot of the left panel. */
function BrandWave() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute bottom-0 right-0 h-[46%] w-[34%]"
      viewBox="0 0 320 400"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="bw-a" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.16" />
          <stop offset="1" stopColor="#E3F0DA" stopOpacity="0.34" />
        </linearGradient>
        <linearGradient id="bw-b" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.12" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      <path d="M320 96 C 244 168 208 276 184 400 L320 400 Z" fill="url(#bw-a)" />
      <path d="M320 18 C 272 112 250 240 236 400 L320 400 Z" fill="url(#bw-b)" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const signInAs = useAuthStore((s) => s.signInAs);

  const [error, setError] = useState<string | null>(null);
  /** Which card is mid-flight, so only that one shows a spinner. */
  const [busy, setBusy] = useState<EntryRole | null>(null);

  const live = isLive();
  const entries = live ? ENTRY : ENTRY.filter((e) => e.role === "applicant" || e.role === "officer");

  useEffect(() => hydrate(), [hydrate]);
  useEffect(() => {
    if (hydrated && session) router.replace(HOME[session.role]);
  }, [hydrated, session, router]);

  const enter = async (role: EntryRole) => {
    if (busy) return;
    setBusy(role);
    const result = await signInAs(role);
    setBusy(null);
    if (!result.ok) {
      // In live mode this is the server saying no — a seeded account missing,
      // or the API unreachable. Say what came back rather than a generic line.
      setError(result.message);
      return;
    }
    setError(null);
    router.replace(HOME[result.session.role]);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F1F5F9] font-display text-[#1F2937]">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-32 h-[420px] w-[520px] rounded-[50%] bg-[#DCEBD8] opacity-60 blur-[2px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 right-[240px] h-[300px] w-[420px] rounded-[50%] bg-[#DEE9F4] opacity-70"
      />
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-6 py-5 lg:px-10">
        {/* Masthead */}
        <header className="flex flex-wrap items-center justify-between gap-3 pb-5">
          <div className="flex items-center gap-3">
            <StateEmblem size={44} />
            <div className="leading-tight">
              <div className="text-[15px] font-semibold text-[#15365B]">Government of India</div>
              <div className="text-[12.5px] text-[#556478]">
                Ministry of Food Processing Industries
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-[#556478]">
            <span>Transparent</span>
            <span className="text-[#C7D2DD]">•</span>
            <span>Efficient</span>
            <span className="text-[#C7D2DD]">•</span>
            <span>Inclusive</span>
          </div>
        </header>

        {/* Card */}
        <main className="grid flex-1 overflow-hidden rounded-2xl bg-white shadow-[0_18px_50px_rgba(21,54,91,0.10)] lg:grid-cols-[52fr_48fr]">
          {/* Left — brand. The scene is the panel's background, not a band at
              its foot, so the sky runs behind the wordmark and the headline. */}
          <section className="relative flex min-h-[560px] flex-col overflow-hidden">
            <PlantScene className="absolute inset-0 h-full w-full" />
            <div
              aria-hidden
              className="absolute inset-x-0 top-0 h-[62%] bg-gradient-to-b from-[rgba(236,243,250,0.92)] via-[rgba(236,243,250,0.55)] to-transparent"
            />
            <BrandWave />
            <div className="relative px-8 pt-10 sm:px-12 lg:px-[62px] lg:pt-[62px]">
              <div className="flex items-center gap-3">
                <AnumatiMark size={54} />
                <span className="text-[34px] font-bold tracking-[0.13em] text-[#15365B]">
                  ANUMATI
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 pl-1 text-[12.5px]">
                {ACRONYM.map((word, i) => (
                  <span key={word} className="flex items-center gap-2">
                    <span className="text-[#44688F]">{word}</span>
                    {i < ACRONYM.length - 1 && i < 4 ? (
                      <span className="text-[#9FB6CC]">•</span>
                    ) : null}
                  </span>
                ))}
              </div>

              <div className="mt-6 h-[3px] w-[84px] rounded-full bg-gradient-to-r from-[#15365B] to-[#7DC242]" />

              <h1 className="mt-6 max-w-[580px] text-[30px] font-bold leading-[1.3] text-[#15365B]">
                Simplifying Approvals
                <br className="hidden lg:block" /> for a Stronger Food Processing
                <br className="hidden lg:block" /> Ecosystem
              </h1>

              <p className="mt-5 max-w-[540px] text-[14px] leading-[1.72] text-[#5A7085]">
                ANUMATI helps you track, manage and accelerate
                <br className="hidden lg:block" /> approvals for food processing and packaging units
                <br className="hidden lg:block" /> across India — with complete transparency and
                real-time
                <br className="hidden lg:block" /> insights.
              </p>

              <div className="mt-8 flex max-w-[470px] items-start">
                {PILLARS.map(({ Icon, line1, line2 }, i) => (
                  <div
                    key={line1}
                    className={`flex-1 pr-4 ${i > 0 ? "border-l border-[#C6D7E6] pl-4" : ""}`}
                  >
                    <Icon className="h-[21px] w-[21px] text-[#2C5580]" strokeWidth={1.5} />
                    <div className="mt-2 text-[12px] font-medium leading-[1.35] text-[#3F5C79]">
                      {line1}
                      <br />
                      {line2}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Caption, held to the foot of the panel over the fields */}
            <div className="relative mt-16 flex-1" />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-[rgba(12,32,52,0.66)] to-transparent"
            />
            <div className="relative flex items-start gap-2.5 px-8 pb-7 sm:px-12 lg:px-[62px]">
              <MapPin className="mt-0.5 h-4 w-4 flex-none text-white" strokeWidth={1.7} />
              <div className="leading-tight text-white">
                <div className="text-[14px] font-semibold">Supporting Atmanirbhar Bharat</div>
                <div className="text-[12.5px] text-white/85">
                  Through Efficient Food Processing &amp; Packaging
                </div>
              </div>
            </div>
          </section>

          {/* Right — the form sits in its own card, inset from the panel */}
          <section className="flex flex-col bg-[#FAFBFD] p-5 sm:p-8 lg:py-[68px] lg:pl-[62px] lg:pr-[36px]">
            <div className="flex flex-1 flex-col rounded-[18px] border border-[#EFF2F7] bg-white px-6 py-8 shadow-[0_12px_38px_rgba(21,54,91,0.07)] sm:px-9 lg:px-[54px] lg:py-[42px]">

            <div className="flex flex-1 flex-col justify-center py-6">
            <h2 className="text-[34px] font-bold leading-none text-[#15365B]">Welcome</h2>
            <p className="mt-3 text-[14.5px] leading-snug text-[#556478]">
              Choose how you are coming in. This is a demonstration build — no password is needed,
              and each role opens its own product.
            </p>

            {error ? (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3.5 py-2.5 text-[13px] leading-snug text-[#B91C1C]"
              >
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col gap-2.5">
              {entries.map(({ role, Icon, title, line }) => (
                <button
                  key={role}
                  type="button"
                  disabled={busy !== null}
                  onClick={() => enter(role)}
                  className="group flex items-center gap-3.5 rounded-[12px] border border-[#E2E8F0] px-4 py-3.5 text-left transition-colors hover:border-[#15365B] hover:bg-[#F8FAFC] disabled:opacity-60"
                >
                  <span className="flex h-10 w-10 flex-none items-center justify-center rounded-[10px] bg-[#EEF3F8] text-[#15365B]">
                    {busy === role ? (
                      <Loader2 className="h-[18px] w-[18px] animate-spin" strokeWidth={1.8} />
                    ) : (
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14.5px] font-semibold text-[#15365B]">{title}</span>
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-[#556478]">{line}</span>
                  </span>
                  <ArrowRight
                    className="h-4 w-4 flex-none text-[#94A3B8] transition-colors group-hover:text-[#15365B]"
                    strokeWidth={1.8}
                  />
                </button>
              ))}
            </div>

            <p className="mt-4 text-[11.5px] leading-snug text-[#66758A]">
              {live
                ? "In deployment this screen is MAITRI 2.0 sign-in — an applicant or an officer keeps the account they already have, and the server decides what each one may do."
                : "The Empowered Committee and rule review desks write to the server, so they appear once one is running. In deployment this screen is MAITRI 2.0 sign-in."}
            </p>

            <div className="mt-5 flex items-center justify-center">
              <ModeBadge />
            </div>

            <div className="mt-8 flex items-center gap-3">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#EEF3F8] text-[14px] font-semibold text-[#15365B]">
                ?
              </span>
              <div className="leading-tight">
                <div className="text-[13.5px] font-medium text-[#1F2937]">Need help?</div>
                <p className="text-[12.5px] text-[#556478]">
                  Sign-in problems go to your department&apos;s MAITRI 2.0 administrator.
                </p>
              </div>
            </div>

            </div>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-3 pt-5 text-[12.5px] text-[#556478]">
          <div className="flex items-center gap-3">
            <Link href="/standard" className="no-underline hover:text-[#15365B]">
              Open standard (OAGS)
            </Link>
          </div>
          <div>© 2026 ANUMATI</div>
        </footer>
      </div>
    </div>
  );
}
