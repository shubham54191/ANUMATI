"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LeverRow } from "@/components/simulator/LeverRow";
import { HighestImpactCard } from "@/components/simulator/HighestImpactCard";
import { GuardrailCard } from "@/components/simulator/GuardrailCard";
import { getRoadmapSync } from "@/lib/api/roadmap";
import { DEFAULT_REQUEST } from "@/lib/data/engine";
import { runSimulation, totalWithMany } from "@/lib/api/simulate";
import { useRoadmapStore } from "@/store/useRoadmapStore";
import { pct } from "@/lib/format/days";
import { useCountUp } from "@/hooks/useCountUp";

export function SimulatorView({ roadmapId }: { roadmapId: string }) {
  const conditions = useRoadmapStore((s) => s.conditions);
  const viewMode = useRoadmapStore((s) => s.viewMode);
  const setViewMode = useRoadmapStore((s) => s.setViewMode);
  const { data: roadmap, meta } = useMemo(
    () => getRoadmapSync({ ...DEFAULT_REQUEST, conditions }),
    [conditions],
  );

  const impacts = useMemo(() => runSimulation(roadmap), [roadmap]);
  const [chosen, setChosen] = useState<string[]>(["L1", "L2"]);

  const baseline = roadmap.optimised_days;
  const maxSaved = Math.max(...impacts.map((i) => i.days_saved ?? 0), 1);
  const legal = impacts.filter((i) => !i.illegal);
  const best = legal[0];
  const refused = impacts.find((i) => i.illegal);

  const total = useMemo(
    () => totalWithMany(roadmap, impacts.filter((i) => chosen.includes(i.lever.id)).map((i) => i.lever)),
    [roadmap, impacts, chosen],
  );
  const saved = baseline - total;
  const shownTotal = useCountUp(total, 620);
  const shownSaved = useCountUp(saved, 620);

  const searchParams = useSearchParams();
  useEffect(() => {
    if (searchParams.get("role") === "department" || viewMode !== "department") {
      setViewMode("department");
    }
  }, [searchParams, viewMode, setViewMode]);

  const toggle = (id: string) =>
    setChosen((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  if (viewMode !== "department" && searchParams.get("role") !== "department") {
    return (
      <AppShell active="roadmap" meta={meta}>
        <main className="flex flex-1 items-center justify-center">
          <EmptyState
            title="This one belongs to the department"
            body="Reform levers change statutory timelines and departmental practice, so they are a single-window tool rather than an applicant one. Switch to the department view to open it."
            action={
              <Button variant="primary" onClick={() => setViewMode("department")}>
                Switch to the department view
              </Button>
            }
          />
        </main>
      </AppShell>
    );
  }

  return (
    <AppShell active="roadmap" meta={meta}>
      <div className="flex h-[52px] flex-none items-center gap-3.5 border-b border-line bg-surface px-5">
        <Label>Policy simulator</Label>
        <span className="font-mono text-[11px] text-muted">{roadmapId}</span>
        <span className="h-[18px] w-px bg-line" />
        <span className="text-[13px] text-ink">
          Food processing unit <span className="text-line-strong">/</span> Pune, Maharashtra{" "}
          <span className="text-line-strong">/</span> baseline{" "}
          <span className="font-num font-mono text-[12.5px] font-medium">{baseline} days</span>
        </span>
        <div className="flex-1" />
        <Button onClick={() => setChosen([])}>Reset</Button>
        <Link href={`/roadmap/${roadmapId}`} className="no-underline">
          <Button>Back to roadmap</Button>
        </Link>
        <Button variant="primary">
          <Download className="h-3 w-3" strokeWidth={1.4} />
          Export brief
        </Button>
      </div>

      <div className="flex min-h-0 flex-1">
        <section className="flex w-[668px] flex-none flex-col overflow-y-auto border-r border-line bg-surface">
          <div className="border-b border-line px-5 pb-3.5 pt-4">
            <h2 className="mb-1.5 font-serif text-[22px] font-medium text-ink">Reform levers</h2>
            <p className="max-w-[520px] text-[12.5px] leading-relaxed text-muted">
              Each lever is re-run through the same critical-path engine that built the roadmap. A
              lever off the critical path saves nothing — and the engine says so instead of
              flattering the reform.
            </p>
          </div>
          {impacts.map((impact) => (
            <LeverRow
              key={impact.lever.id}
              impact={impact}
              selected={chosen.includes(impact.lever.id)}
              maxSaved={maxSaved}
              onToggle={() => toggle(impact.lever.id)}
            />
          ))}
        </section>

        <section className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <div className="border-b border-line bg-surface px-[22px] py-4">
            <div className="mb-4 flex items-end gap-9">
              <div>
                <Label className="mb-0.5 block">With selected reforms</Label>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-num font-serif text-[52px] font-medium leading-none text-ink">
                    {shownTotal}
                  </span>
                  <span className="text-[13px] text-muted">days</span>
                </div>
              </div>
              <div className="pb-1">
                <Label className="mb-0.5 block text-critical">Further saving</Label>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-num font-serif text-[32px] leading-none text-critical">
                    {shownSaved}
                  </span>
                  <span className="text-xs text-critical">days</span>
                  <span className="font-num ml-1 font-mono text-[11px] text-faint">
                    −{pct(saved, baseline)} on top
                  </span>
                </div>
              </div>
              <div className="flex-1" />
              <div className="pb-1.5 text-right">
                <Label className="mb-0.5 block">Levers applied</Label>
                <span className="font-num font-mono text-[13px] font-medium text-ink">
                  {chosen.length} of {legal.length}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {[
                { label: "Today", width: 420, value: `${baseline} d`, cls: "bg-line-strong" },
                {
                  label: "Simulated",
                  width: Math.round((total / baseline) * 420),
                  value: `${total} d`,
                  cls: "bg-ink",
                },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3">
                  <span className="label w-28 flex-none">{row.label}</span>
                  <span
                    className={`h-4 flex-none rounded-sm ${row.cls}`}
                    style={{
                      width: row.width,
                      transition: "width 520ms var(--ease-collapse)",
                    }}
                  />
                  <span className="font-num font-mono text-[11.5px] text-ink">{row.value}</span>
                </div>
              ))}
              <div className="flex items-center gap-3">
                <span className="label w-28 flex-none">Sequential today</span>
                <span
                  className="h-4 w-[420px] flex-none rounded-sm border border-line"
                  style={{
                    background:
                      "repeating-linear-gradient(135deg,var(--surface-sunk) 0 5px,var(--bg) 5px 10px)",
                  }}
                />
                <span className="font-num font-mono text-[11.5px] text-faint">
                  {roadmap.sequential_days} d
                </span>
              </div>
            </div>
          </div>

          <div className="flex border-b border-line">
            <HighestImpactCard best={best} baseline={baseline} />
            <GuardrailCard refused={refused} />
          </div>

          <div className="px-[22px] py-4">
            <Label className="mb-2 block">How the combined number is computed</Label>
            <p className="max-w-[620px] text-[12.5px] leading-relaxed text-muted">
              Selecting several levers re-runs the whole graph with all of them applied — it does
              not add the individual savings together. Two levers that touch the same approval, or
              that both sit on the critical path, overlap; adding them would overstate the reform.
              The single-lever column above is what each one is worth on its own.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
