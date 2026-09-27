"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/auth/AuthGate";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Label } from "@/components/ui/Card";
import { Explain } from "@/components/ui/Explain";
import { CONDITIONS, LAND_REGIMES, SECTORS, SIZE_BANDS, STAGES } from "@/lib/constants/sectors";
import { LOCATIONS } from "@/lib/constants/locations";
import { localMeta } from "@/lib/api/roadmap";
import { APPROVALS, DEPENDENCIES } from "@/lib/data/maharashtraFood";
import { DEFAULT_ANSWERS, decodeAnswers, encodeAnswers } from "@/lib/roadmap/setupParams";
import { cn } from "@/lib/utils";

export default function NewRoadmapPage() {
  const router = useRouter();
  const meta = localMeta();
  const [sector, setSector] = useState<string>(DEFAULT_ANSWERS.sector);
  const [location, setLocation] = useState<string>(DEFAULT_ANSWERS.location);
  const [size, setSize] = useState<string>(DEFAULT_ANSWERS.size);
  const [land, setLand] = useState<string>(DEFAULT_ANSWERS.land);
  const [stage, setStage] = useState<string>(DEFAULT_ANSWERS.stage);
  const [on, setOn] = useState<Record<string, boolean>>(DEFAULT_ANSWERS.on);
  const [returning, setReturning] = useState(false);

  // "Change answers" on the roadmap comes back here with the answers in the
  // URL. Read them once, so the form opens where the applicant left it.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (![...q.keys()].length) return;
    const a = decodeAnswers(q);
    setSector(a.sector);
    setLocation(a.location);
    setSize(a.size);
    setLand(a.land);
    setStage(a.stage);
    setOn(a.on);
    setReturning(true);
  }, []);

  const generate = () => {
    const params = encodeAnswers({
      sector,
      location,
      land: land === "private" ? "private" : "midc",
      size,
      stage,
      on,
    });
    router.push(`/roadmap/RM-4F2A81?${params.toString()}`);
  };

  return (
    <AuthGate allow="applicant">
    <AppShell active="roadmap" meta={meta}>
      <main className="flex flex-1 justify-center overflow-y-auto pt-16">
        <div className="flex w-[960px] gap-8 pb-16">
          <section className="w-[660px] flex-none">
            <Label className="anim-rise mb-3 block">New roadmap</Label>
            <h1 style={{ animationDelay: "60ms" }} className="anim-rise mb-3 font-serif text-[42px] font-medium leading-[1.1] tracking-[-0.01em] text-ink">
              What are you setting up?
            </h1>
            <p style={{ animationDelay: "120ms" }} className="anim-rise mb-7 max-w-[520px] text-[14.5px] leading-relaxed text-muted">
              Five answers. You get every approval you need, in the order the law requires.
            </p>

            {returning ? (
              <p className="mb-3 text-[12.5px] text-db-blue">Your earlier answers are filled in. Change what you need and generate again.</p>
            ) : null}

            <div style={{ animationDelay: "180ms" }} className="anim-rise rounded border border-line bg-surface">
              {[
                { label: "Sector", value: sector, set: setSector, options: SECTORS },
                { label: "Location", value: location, set: setLocation, options: LOCATIONS },
                { label: "Land", value: land, set: setLand, options: LAND_REGIMES },
                { label: "Size band", value: size, set: setSize, options: SIZE_BANDS },
                { label: "Stage", value: stage, set: setStage, options: STAGES },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-5 border-b border-line px-5 py-3.5">
                  <label
                    htmlFor={`f-${row.label}`}
                    className="label w-[150px] flex-none"
                  >
                    {row.label}
                  </label>
                  <Select
                    id={`f-${row.label}`}
                    className="flex-1"
                    value={row.value}
                    options={row.options}
                    onChange={row.set}
                  />
                </div>
              ))}

              <p className="border-b border-line px-5 py-2.5 text-[12px] leading-relaxed text-muted">
                Rule base {meta.rules_version} covers food processing in Pune district, for a new setup. Other sectors,
                districts and stages are listed so you can see what is coming — they cannot be chosen until their rules
                are extracted and published.
              </p>

              <div className="border-b border-line bg-bg px-5 pb-3.5 pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <Label>Conditions — optional</Label>
                  <span className="text-[11.5px] text-muted">These add or remove approvals</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {CONDITIONS.map((c) => {
                    const active = Boolean(on[c.id]);
                    return (
                      <button
                        key={c.id}
                        onClick={() => setOn((s) => ({ ...s, [c.id]: !s[c.id] }))}
                        aria-pressed={active}
                        className={cn(
                          "inline-flex h-[30px] items-center gap-2 rounded border bg-surface px-[11px] text-[12.5px]",
                          active ? "border-ink text-ink" : "border-line text-muted hover:border-line-strong",
                        )}
                      >
                        {c.label}
                        <span
                          className={cn(
                            "font-mono text-[10px]",
                            active ? "text-state-active" : "text-faint",
                          )}
                        >
                          +{c.adds}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-4 px-5 py-4">
                <Button
                  size="md"
                  variant="primary"
                  onClick={generate}
                >
                  Generate roadmap
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                </Button>
              </div>
            </div>

            <Explain className="mt-4">
              Every roadmap is stored against the rule version used to build it. Re-open this ID in a year
              and you will see the rules as they stood today, not as they stand then.
            </Explain>
          </section>

          <aside style={{ animationDelay: "260ms" }} className="anim-rise flex w-[268px] flex-none flex-col gap-4 pt-10">
            <div className="rounded border border-line bg-surface px-4 py-3.5">
              <Label className="mb-3 block">Rule base</Label>
              <div className="mb-3 flex items-baseline gap-2">
                <span className="font-serif text-[26px] font-medium text-ink">
                  {meta.rules_version}
                </span>
                <span className="font-num font-mono text-[11px] text-muted">
                  as of {meta.rules_as_of}
                </span>
              </div>
              <dl className="flex flex-col gap-2">
                {[
                  ["Published approvals", String(meta.approvals_count)],
                  ["Dependency edges", String(DEPENDENCIES.length)],
                  ["Awaiting review", String(meta.flagged_count)],
                  [
                    "Source documents",
                    String(new Set(APPROVALS.map((a) => a.source.document_id)).size),
                  ],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between">
                    <dt className="text-[12.5px] text-muted">{k}</dt>
                    <dd
                      className={cn(
                        "font-num font-mono text-xs font-medium",
                        k === "Awaiting review" ? "text-state-deemed-ink" : "text-ink",
                      )}
                    >
                      {v}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded border border-line bg-sunk px-4 py-3.5">
              <Label className="mb-2 block text-ink">Open standard</Label>
              <p className="mb-2.5 text-xs text-muted">Published as OAGS.</p>
              <Link href="/standard" className="text-xs text-state-active hover:underline">
                View the schema →
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </AppShell>
    </AuthGate>
  );
}
