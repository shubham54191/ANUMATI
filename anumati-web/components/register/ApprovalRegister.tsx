"use client";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { Roadmap } from "@/types/roadmap";
import type { ApprovalEvidence } from "@/types/report";
import type { Stage } from "@/types/approval";
import { EDGE_SPEC } from "@/lib/constants/edgeTypes";
import { useRoadmapStore } from "@/store/useRoadmapStore";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

const STAGES: { id: Stage; title: string; blurb: string }[] = [
  {
    id: "pre_establishment",
    title: "Pre-establishment",
    blurb: "Everything needed before the unit can be built and fitted out.",
  },
  {
    id: "pre_operation",
    title: "Pre-operation",
    blurb: "Everything needed before the unit can lawfully start producing.",
  },
];

export function ApprovalRegister({
  roadmap,
  evidence,
}: {
  roadmap: Roadmap;
  evidence: Record<string, ApprovalEvidence>;
}) {
  const select = useRoadmapStore((s) => s.select);
  const selectedId = useRoadmapStore((s) => s.selectedApprovalId);
  const [query, setQuery] = useState("");

  const criticalSet = useMemo(
    () => new Set(roadmap.critical_path),
    [roadmap.critical_path],
  );

  const prereqs = useMemo(() => {
    const map = new Map<string, { id: string; type: string }[]>();
    for (const d of roadmap.dependencies) {
      const list = map.get(d.to_approval_id) ?? [];
      list.push({ id: d.from_approval_id, type: d.edge_type });
      map.set(d.to_approval_id, list);
    }
    return map;
  }, [roadmap.dependencies]);

  const q = query.trim().toLowerCase();
  const matches = (id: string) => {
    if (!q) return true;
    const a = roadmap.approvals.find((x) => x.id === id)!;
    return (
      a.name.toLowerCase().includes(q) ||
      a.department_name.toLowerCase().includes(q) ||
      a.id.toLowerCase().includes(q) ||
      a.source.document_id.toLowerCase().includes(q)
    );
  };

  const byStage = STAGES.map((stage) => {
    const rows = roadmap.approvals
      .filter((a) => a.stage === stage.id)
      .sort((a, b) => {
        const fa = roadmap.earliest_finish[a.id] - a.statutory_days;
        const fb = roadmap.earliest_finish[b.id] - b.statutory_days;
        return fa - fb || a.id.localeCompare(b.id);
      });
    return { stage, rows, shown: rows.filter((a) => matches(a.id)) };
  });

  const total = byStage.reduce((n, s) => n + s.shown.length, 0);

  return (
    <div className="print-flow flex h-full flex-col overflow-hidden bg-bg">
      {}
      <div className="flex h-[52px] flex-none items-center gap-3 border-b border-line bg-surface px-5 print:hidden">
        <label className="flex h-8 w-[320px] items-center gap-2 rounded border border-control bg-bg px-3 focus-within:ring-2 focus-within:ring-ink">
          <Search className="h-3.5 w-3.5 flex-none text-faint" strokeWidth={1.4} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by approval, department or act"
            aria-label="Filter the register"
            className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-faint"
          />
        </label>
        <span className="font-num font-mono text-[11.5px] text-muted">
          {total} of {roadmap.approvals.length} shown
        </span>
        <div className="flex-1" />
      </div>

      <div className="flex-1 overflow-y-auto">
        {}
        <div className="hidden px-5 print:mb-5 print:block">
          <div className="flex items-baseline justify-between border-b border-ink pb-2">
            <span className="text-[15px] font-semibold tracking-[0.16em]">ANUMATI</span>
            <span className="font-mono text-[10px]">
              {roadmap.id} · rules v1.3 · generated {new Date().toISOString().slice(0, 10)}
            </span>
          </div>
          <h1 className="mt-3 font-serif text-[20px] font-medium">
            Approval register — {roadmap.approvals.length} approvals
          </h1>
          <p className="mt-1 text-[11px]">
            Food processing unit · Pune, Maharashtra — MIDC Chakan · 50–100
            employees · new setup
          </p>
          <p className="mt-2 font-mono text-[11px]">
            {roadmap.sequential_days} d if filed one after another ·{" "}
            {roadmap.optimised_days} d on the critical path ·{" "}
            {roadmap.sequential_days - roadmap.optimised_days} d recoverable by
            filing in parallel
          </p>
          <p className="mt-2 text-[10.5px]">
            Every row cites the provision it comes from. Day numbers are counted
            from the day the first application is filed.
          </p>
        </div>

        {total === 0 ? (
          <EmptyState
            title="Nothing matches that"
            body="Try an approval name, a department, or the short name of an act — MRTP-ACT-1966, for instance."
            action={<Button onClick={() => setQuery("")}>Clear the filter</Button>}
          />
        ) : null}

        {byStage.map(({ stage, rows, shown }) => {
          if (shown.length === 0) return null;
          const stageCritical = rows.filter((a) => criticalSet.has(a.id)).length;
          const stageDays = rows.reduce((n, a) => n + a.statutory_days, 0);

          return (
            <section key={stage.id} className="break-inside-avoid">
              <header className="sticky top-0 z-10 flex items-baseline gap-4 border-b border-line bg-sunk px-5 py-3 print:static print:bg-white">
                <h2 className="font-serif text-[19px] font-medium text-ink">
                  {stage.title}
                </h2>
                <span className="font-num font-mono text-[11px] text-muted">
                  {rows.length} approvals · {stageDays} d of filing time ·{" "}
                  {stageCritical} on the critical path
                </span>
                <span className="hidden text-[12px] text-muted lg:inline print:inline">
                  {stage.blurb}
                </span>
              </header>

              <div
                role="table"
                aria-label={`${stage.title} approvals`}
                className="px-5"
              >
                <div
                  role="row"
                  className="flex items-center gap-4 border-b border-line py-2 pl-2.5 text-faint"
                >
                  <span role="columnheader" className="label w-8 flex-none">
                    #
                  </span>
                  <span role="columnheader" className="label flex-1">
                    Approval and the provision it comes from
                  </span>
                  <span role="columnheader" className="label w-[168px] flex-none">
                    Department
                  </span>
                  <span role="columnheader" className="label w-[118px] flex-none">
                    Waits on
                  </span>
                  <span role="columnheader" className="label w-[104px] flex-none text-right">
                    Window
                  </span>
                  <span role="columnheader" className="label w-[72px] flex-none text-right">
                    Statutory
                  </span>
                  <span
                    role="columnheader"
                    className="label w-[96px] flex-none text-right"
                    title="Median of what applicants reported actually waiting, and the sample it rests on"
                  >
                    Observed
                  </span>
                  <span role="columnheader" className="label w-[78px] flex-none text-right">
                    Deemed
                  </span>
                </div>

                {shown.map((a, i) => {
                  const onCritical = criticalSet.has(a.id);
                  const finish = roadmap.earliest_finish[a.id];
                  const start = finish - a.statutory_days;
                  const waits = prereqs.get(a.id) ?? [];

                  return (
                    <button
                      key={a.id}
                      role="row"
                      data-approval={a.id}
                      onClick={() => select(a.id === selectedId ? null : a.id)}
                      className={cn(
                        "flex w-full items-start gap-4 border-b border-line py-3 pl-2.5 text-left",
                        "transition-colors hover:bg-sunk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink",
                        "break-inside-avoid print:hover:bg-transparent",
                        onCritical && "shadow-[inset_3px_0_0_var(--critical)]",
                        !onCritical && a.flagged && "shadow-[inset_3px_0_0_var(--state-deemed)]",
                        selectedId === a.id && "bg-sunk",
                      )}
                    >
                      <span
                        role="cell"
                        className={cn(
                          "font-num w-8 flex-none pt-0.5 font-mono text-[11.5px]",
                          onCritical ? "font-semibold text-critical" : "text-faint",
                        )}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>

                      <span role="cell" className="flex-1">
                        <span className="flex items-center gap-2">
                          <span className="text-[13.5px] font-medium leading-snug text-ink">
                            {a.name}
                          </span>
                          <span className="font-num font-mono text-[10.5px] text-faint">
                            {a.id}
                          </span>
                          {onCritical ? (
                            <span className="font-mono text-[10px] font-medium tracking-[0.06em] text-critical">
                              CRITICAL PATH
                            </span>
                          ) : null}
                          {a.flagged ? (
                            <span className="font-mono text-[10px] font-medium tracking-[0.06em] text-state-deemed-ink">
                              UNDER REVIEW
                            </span>
                          ) : null}
                        </span>
                        {a.name_mr ? (
                          <span className="mt-0.5 block text-[12.5px] text-muted">
                            {a.name_mr}
                          </span>
                        ) : null}
                        <span className="mt-1 block text-[11.5px] leading-snug text-muted">
                          {a.source.document_id.replace(/-/g, " ")} ·{" "}
                          <span className="font-mono">{a.source.section}</span>
                        </span>
                      </span>

                      <span
                        role="cell"
                        className="w-[168px] flex-none pt-0.5 text-[12.5px] leading-snug text-ink"
                      >
                        {a.department_name}
                      </span>

                      <span role="cell" className="flex w-[118px] flex-none flex-wrap gap-1 pt-0.5">
                        {waits.length === 0 ? (
                          <span className="text-[12px] text-faint" title="No prerequisite — this can be filed on day one">
                              —
                            </span>
                        ) : (
                          waits.map((w) => (
                            <span
                              key={w.id}
                              title={`${w.id} · ${EDGE_SPEC[w.type as keyof typeof EDGE_SPEC].label}`}
                              className="font-num inline-flex h-[19px] items-center rounded-sm border-l-2 bg-bg px-1.5 font-mono text-[10.5px] text-ink"
                              style={{
                                borderLeftColor: `var(${EDGE_SPEC[w.type as keyof typeof EDGE_SPEC].colorVar})`,
                                borderTop: "1px solid var(--border)",
                                borderRight: "1px solid var(--border)",
                                borderBottom: "1px solid var(--border)",
                              }}
                            >
                              {w.id}
                              <span className="sr-only">
                                {" "}
                                {EDGE_SPEC[w.type as keyof typeof EDGE_SPEC].label} dependency
                              </span>
                            </span>
                          ))
                        )}
                      </span>

                      <span
                        role="cell"
                        className="font-num w-[104px] flex-none pt-0.5 text-right font-mono text-[12px] text-muted"
                      >
                        d{start} – d{finish}
                      </span>

                      <span
                        role="cell"
                        className="font-num w-[72px] flex-none pt-0.5 text-right font-mono text-[12.5px] font-semibold text-ink"
                      >
                        {a.statutory_days} d
                      </span>

                      <span role="cell" className="w-[96px] flex-none pt-0.5 text-right">
                        {(() => {
                          const e = evidence[a.id];
                          if (!e || e.sample === 0) {
                            return (
                              <span
                                className="font-mono text-[11.5px] text-faint"
                                title="Nobody has reported a timing for this approval yet"
                              >
                                no data
                              </span>
                            );
                          }
                          const slower = (e.delta ?? 0) > 0;
                          return (
                            <>
                              <span
                                className={cn(
                                  "font-num block font-mono text-[12.5px] font-semibold",
                                  slower ? "text-critical" : "text-state-done-ink",
                                )}
                              >
                                {e.observed_days} d
                              </span>
                              <span className="font-num block font-mono text-[10px] text-faint">
                                {slower ? "+" : ""}
                                {e.delta} · n={e.sample}
                              </span>
                            </>
                          );
                        })()}
                      </span>

                      <span
                        role="cell"
                        className={cn(
                          "font-num w-[78px] flex-none pt-0.5 text-right font-mono text-[12px]",
                          a.deemed_exists ? "text-state-deemed-ink" : "text-faint",
                        )}
                      >
                        {a.deemed_exists ? `${a.deemed_days} d` : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}

        <footer className="px-5 py-5">
          <Label className="mb-2 block">How to read the Waits on column</Label>
          <div className="flex flex-wrap gap-4">
            {(Object.keys(EDGE_SPEC) as (keyof typeof EDGE_SPEC)[]).map((t) => (
              <span key={t} className="flex items-center gap-2">
                <span
                  className="h-[14px] w-[3px] rounded-sm"
                  style={{ background: `var(${EDGE_SPEC[t].colorVar})` }}
                />
                <span className="text-[12px] text-ink">{EDGE_SPEC[t].label}</span>
                <span className="text-[11.5px] text-muted">{EDGE_SPEC[t].blurb}</span>
              </span>
            ))}
          </div>
          <p className="mt-4 max-w-3xl text-[12px] leading-relaxed text-muted">
            A dash under Waits on means nothing blocks that approval — it can be
            filed on day one. Every row cites the provision it comes from. A row with no citation
            cannot exist — the rule store refuses to hold one. Where a dependency
            rests on practice rather than law it says so, at half confidence, and
            it is the only kind the reform simulator is allowed to remove.
          </p>
        </footer>
      </div>
    </div>
  );
}
