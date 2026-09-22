"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, Info } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { AuthGate } from "@/components/auth/AuthGate";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Label } from "@/components/ui/Card";
import { CONDITIONS, LAND_REGIMES, SECTORS, SIZE_BANDS, STAGES } from "@/lib/constants/sectors";
import { LOCATIONS } from "@/lib/constants/locations";
import { localMeta } from "@/lib/api/roadmap";
import { APPROVALS, DEPENDENCIES } from "@/lib/data/maharashtraFood";
import { cn } from "@/lib/utils";

const EMPLOYEES_BY_BAND: Record<string, number> = {
  micro: 6,
  small: 30,
  medium: 72,
  large: 130,
};

export default function NewRoadmapPage() {
  const router = useRouter();
  const meta = localMeta();
  const [sector, setSector] = useState<string>(SECTORS[0].id);
  const [location, setLocation] = useState<string>(LOCATIONS[0].id);
  const [size, setSize] = useState<string>(SIZE_BANDS[2].id);
  const [land, setLand] = useState<string>(LAND_REGIMES[0].id);
  const [stage, setStage] = useState<string>(STAGES[0].id);
  const [on, setOn] = useState<Record<string, boolean>>({ boiler: true });

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
              Four answers. We return every approval you need, in the order the law actually
              requires — with the section of the act each one comes from.
            </p>

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
                  onClick={() => {
                    const employees = EMPLOYEES_BY_BAND[size] ?? 72;
                    const params = new URLSearchParams({ employees: String(employees) });
                    // Drives both the land-use conversion approval and which
                    // authority sanctions the building plan.
                    params.set("midc_land", land === "midc" ? "1" : "0");
                    // heightM drives conditions.height (>15m) in the store, so the
                    // slider on the next screen and this toggle stay consistent —
                    // send a metre value, not the boolean, for that one condition.
                    if (on.height) params.set("heightM", "20");
                    for (const c of CONDITIONS) {
                      if (c.id !== "height" && on[c.id]) params.set(c.id, "1");
                    }
                    router.push(`/roadmap/RM-4F2A81?${params.toString()}`);
                  }}
                >
                  Generate roadmap
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                </Button>
                <span className="font-mono text-[11px] text-faint">
                  Typically 32 approvals · computes in under 2 s
                </span>
              </div>
            </div>

            <div className="mt-4 flex max-w-[560px] items-start gap-2">
              <Info className="mt-[3px] h-3 w-3 flex-none text-faint" strokeWidth={1.3} />
              <span className="text-xs leading-relaxed text-muted">
                Every roadmap is stored immutably against the rule version used to build it. Re-open
                this ID in a year and you will see the rules as they stood today, not as they stand
                then.
              </span>
            </div>
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
              <p className="mb-2.5 text-xs leading-relaxed text-muted">
                This rule base is published as OAGS — an open schema any state or portal can adopt.
              </p>
              <span className="text-xs text-state-active">View the schema →</span>
            </div>
          </aside>
        </div>
      </main>
    </AppShell>
    </AuthGate>
  );
}
