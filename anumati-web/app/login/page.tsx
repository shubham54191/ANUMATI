"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  Eye,
  EyeOff,
  Globe,
  Landmark,
  Lock,
  MapPin,
  Network,
  Radar,
  Timer,
  User,
} from "lucide-react";
import { AnumatiMark } from "@/components/brand/AnumatiMark";
import { PlantScene } from "@/components/brand/PlantScene";
import { StateEmblem } from "@/components/brand/StateEmblem";
import { useAuthStore } from "@/store/useAuthStore";

const HOME: Record<string, string> = {
  officer: "/matrix",
  applicant: "/roadmap/new",
};

const ACRONYM = ["Approvals", "Navigation", "Unified", "Monitoring", "For", "All", "Industries"];

const PILLARS = [
  { Icon: Timer, line1: "Faster", line2: "Approvals" },
  { Icon: Network, line1: "Better", line2: "Coordination" },
  { Icon: Radar, line1: "Real-time", line2: "Tracking" },
  { Icon: BarChart3, line1: "Data-Driven", line2: "Decisions" },
];

export default function LoginPage() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const signIn = useAuthStore((s) => s.signIn);
  const signInAsApplicant = useAuthStore((s) => s.signInAsApplicant);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(false);
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
    router.replace(username.trim().toLowerCase() === "officer" ? "/matrix" : "/roadmap/new");
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
              <div className="text-[12.5px] text-[#64748B]">
                Ministry of Food Processing Industries
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[12.5px] text-[#64748B]">
            <span>Transparent</span>
            <span className="text-[#C7D2DD]">•</span>
            <span>Efficient</span>
            <span className="text-[#C7D2DD]">•</span>
            <span>Inclusive</span>
          </div>
        </header>

        {/* Card */}
        <main className="grid flex-1 overflow-hidden rounded-2xl bg-white shadow-[0_18px_50px_rgba(21,54,91,0.10)] lg:grid-cols-[52fr_48fr]">
          {/* Left — brand */}
          <section className="relative flex min-h-[420px] flex-col bg-gradient-to-b from-[#D9E7F5] via-[#E4EEF7] to-[#EEF4F9]">
            <div className="px-8 pt-10 sm:px-12 lg:px-[60px] lg:pt-12">
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

            {/* Scene */}
            <div className="relative mt-8 h-[248px] flex-none lg:mt-auto lg:h-[302px]">
              <PlantScene className="absolute inset-0 h-full w-full" />
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[rgba(12,32,52,0.62)] to-transparent" />
              <div className="absolute bottom-6 left-8 flex items-start gap-2.5 sm:left-12 lg:left-[60px]">
                <MapPin className="mt-0.5 h-4 w-4 flex-none text-white" strokeWidth={1.7} />
                <div className="leading-tight text-white">
                  <div className="text-[14px] font-semibold">Supporting Atmanirbhar Bharat</div>
                  <div className="text-[12.5px] text-white/85">
                    Through Efficient Food Processing &amp; Packaging
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Right — form */}
          <section className="flex flex-col px-8 py-9 sm:px-12 lg:px-[62px] lg:pb-10 lg:pt-[52px]">
            <div className="flex justify-end">
              <button
                type="button"
                className="flex h-9 items-center gap-2 rounded-full border border-[#E2E8F0] px-3.5 text-[13px] text-[#334155] transition-colors hover:border-[#CBD5E1]"
              >
                <Globe className="h-3.5 w-3.5 text-[#64748B]" strokeWidth={1.7} />
                English
                <ChevronDown className="h-3.5 w-3.5 text-[#94A3B8]" strokeWidth={1.7} />
              </button>
            </div>

            <div className="flex flex-1 flex-col justify-center py-6">
            <h2 className="text-[38px] font-bold leading-none text-[#15365B]">Welcome Back</h2>
            <p className="mt-3 text-[14.5px] text-[#64748B]">Login to your ANUMATI account</p>

            <form onSubmit={submit} className="mt-7 flex flex-col" noValidate>
              <label htmlFor="username" className="mb-2 text-[13px] font-semibold text-[#1F2937]">
                Username / Email ID
              </label>
              <div className="flex h-[52px] items-center gap-3 rounded-[10px] border border-[#E2E8F0] px-4 focus-within:border-[#15365B]">
                <User className="h-4 w-4 flex-none text-[#94A3B8]" strokeWidth={1.7} />
                <input
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username or email"
                  className="w-full bg-transparent text-[14px] text-[#1F2937] outline-none placeholder:text-[#9AA7B4]"
                />
              </div>

              <label htmlFor="password" className="mb-2 mt-5 text-[13px] font-semibold text-[#1F2937]">
                Password
              </label>
              <div className="flex h-[52px] items-center gap-3 rounded-[10px] border border-[#E2E8F0] px-4 focus-within:border-[#15365B]">
                <Lock className="h-4 w-4 flex-none text-[#94A3B8]" strokeWidth={1.7} />
                <input
                  id="password"
                  type={show ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-transparent text-[14px] text-[#1F2937] outline-none placeholder:text-[#9AA7B4]"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? "Hide password" : "Show password"}
                  className="flex-none text-[#94A3B8] hover:text-[#475569]"
                >
                  {show ? (
                    <Eye className="h-4 w-4" strokeWidth={1.7} />
                  ) : (
                    <EyeOff className="h-4 w-4" strokeWidth={1.7} />
                  )}
                </button>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2.5 text-[13.5px] text-[#475569]">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-[17px] w-[17px] rounded-[4px] border-[#CBD5E1] accent-[#15365B]"
                  />
                  Remember me
                </label>
                <a href="#" className="text-[13.5px] text-[#2563EB] no-underline hover:underline">
                  Forgot password?
                </a>
              </div>

              {error ? (
                <p
                  role="alert"
                  className="mt-4 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] px-3.5 py-2.5 text-[13px] leading-snug text-[#B91C1C]"
                >
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                className="mt-6 flex h-[56px] items-center justify-center gap-2.5 rounded-[10px] bg-[#15365B] text-[15.5px] font-semibold text-white transition-colors hover:bg-[#0F2A48]"
              >
                Login
                <ArrowRight className="h-4 w-4" strokeWidth={2} />
              </button>
            </form>

            <div className="my-6 flex items-center gap-4">
              <span className="h-px flex-1 bg-[#E8EDF3]" />
              <span className="text-[12.5px] text-[#94A3B8]">OR</span>
              <span className="h-px flex-1 bg-[#E8EDF3]" />
            </div>

            <button
              type="button"
              onClick={() => {
                signInAsApplicant();
                router.replace("/roadmap/new");
              }}
              className="flex h-[52px] items-center justify-center gap-2.5 rounded-[10px] border border-[#E2E8F0] text-[14.5px] font-medium text-[#1F2937] transition-colors hover:border-[#CBD5E1] hover:bg-[#F8FAFC]"
            >
              <Landmark className="h-[18px] w-[18px] text-[#15365B]" strokeWidth={1.6} />
              Login with Government SSO
            </button>

            <div className="mt-8 flex items-center gap-3">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#EEF3F8] text-[14px] font-semibold text-[#15365B]">
                ?
              </span>
              <div className="leading-tight">
                <div className="text-[13.5px] font-medium text-[#1F2937]">Need help?</div>
                <a
                  href="#"
                  className="flex items-center gap-1.5 text-[12.5px] text-[#64748B] no-underline hover:text-[#15365B]"
                >
                  Contact ANUMATI Support
                  <ArrowRight className="h-3 w-3" strokeWidth={1.8} />
                </a>
              </div>
            </div>

            <p className="mt-6 text-[11.5px] text-[#A3B1BF]">
              Demonstration build · OFFICER / ADMIN · APPLICANT / DEMO
            </p>
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="flex flex-wrap items-center justify-between gap-3 pt-5 text-[12.5px] text-[#64748B]">
          <div className="flex items-center gap-3">
            {["About ANUMATI", "Privacy Policy", "Terms of Use", "Help"].map((item, i) => (
              <span key={item} className="flex items-center gap-3">
                <a href="#" className="no-underline hover:text-[#15365B]">
                  {item}
                </a>
                {i < 3 ? <span className="text-[#D7DEE6]">|</span> : null}
              </span>
            ))}
          </div>
          <div>© 2025 ANUMATI. All rights reserved.</div>
        </footer>
      </div>
    </div>
  );
}
