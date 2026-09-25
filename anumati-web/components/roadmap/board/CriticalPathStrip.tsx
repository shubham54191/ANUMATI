"use client";
import { useMemo } from "react";
import { ChevronRight, CircleCheck, Target } from "lucide-react";
import type { Roadmap } from "@/types/roadmap";
import type { EdgeType } from "@/types/dependency";
import { useRoadmapStore } from "@/store/useRoadmapStore";
import { cn } from "@/lib/utils";

/** How many real cards are drawn before the rest fold into the closing card. */
const VISIBLE = 4;

const EDGE_PILL: Record<EdgeType, { short: string; className: string }> = {
  statutory: { short: "STAT", className: "bg-db-blue-tint text-db-blue" },
  documentary: { short: "DOC", className: "bg-db-purple-tint text-db-purple" },
  physical: { short: "PHYS", className: "bg-db-teal-tint text-db-teal" },
  practice: { short: "PRAC", className: "bg-db-bg text-db-muted" },
};

export function CriticalPathStrip({ roadmap }: { roadmap: Roadmap }) {
  const select = useRoadmapStore((s) => s.select);
  const selectedId = useRoadmapStore((s) => s.selectedApprovalId);

  const { head, tail, tailDays } = useMemo(() => {
    const byId = new Map(roadmap.approvals.map((a) => [a.id, a]));
    const chain = roadmap.critical_path.map((id) => byId.get(id)).filter(Boolean);

    // The link that put each node on the path — real edge data, so the pills
    // vary the way the evidence does rather than repeating one word five times.
    const edgeInto = new Map<string, EdgeType>();
    for (let i = 1; i < chain.length; i++) {
      const from = chain[i - 1]!.id;
      const to = chain[i]!.id;
      const d = roadmap.dependencies.find(
        (x) => x.from_approval_id === from && x.to_approval_id === to,
      );
      if (d) edgeInto.set(to, d.edge_type as EdgeType);
    }

    const cut = chain.length > VISIBLE + 1 ? VISIBLE : Math.max(chain.length - 1, 0);
    const headRows = chain.slice(0, cut).map((a) => ({ a: a!, edge: edgeInto.get(a!.id) ?? null }));
    const tailRows = chain.slice(cut).map((a) => a!);

    return {
      head: headRows,
      tail: tailRows,
      tailDays: tailRows.reduce((n, a) => n + a.statutory_days, 0),
    };
  }, [roadmap]);

  const savedPct = roadmap.sequential_days
    ? ((roadmap.sequential_days - roadmap.optimised_days) / roadmap.sequential_days) * 100
    : 0;

  return (
    <div className="rounded-xl border border-db-red-line bg-db-red-tint px-5 py-4">
      <div className="flex items-center gap-2">
        <Target className="h-4 w-4 text-db-red" strokeWidth={2} />
        <span className="text-[14px] font-semibold text-db-red">Critical Path</span>
      </div>

      <div className="mt-3.5 flex items-center gap-4">
        <div className="flex min-w-0 flex-1 items-stretch gap-2 overflow-x-auto pb-1">
        {head.map(({ a, edge }, i) => (
          <div key={a.id} className="flex flex-none items-center gap-2">
            <button
              onClick={() => select(a.id === selectedId ? null : a.id)}
              className={cn(
                "flex h-[92px] w-[150px] flex-col justify-between rounded-lg border bg-surface px-3 py-2.5 text-left transition-colors",
                selectedId === a.id ? "border-db-red" : "border-db-line hover:border-db-red-line",
              )}
            >
              <span className="font-mono text-[11px] font-semibold tracking-[0.04em] text-db-red">
                {a.id}
              </span>
              <span className="line-clamp-2 text-[12.5px] font-medium leading-tight text-db-ink">
                {a.name}
              </span>
              <span className="flex items-center justify-between">
                <span className="font-num text-[12px] font-semibold text-db-ink">
                  {a.statutory_days} d
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-[2px] font-mono text-[9.5px] font-semibold tracking-[0.05em]",
                    i === 0 || !edge ? "bg-db-red-tint text-db-red" : EDGE_PILL[edge].className,
                  )}
                >
                  {i === 0 || !edge ? "CRITICAL" : EDGE_PILL[edge].short}
                </span>
              </span>
            </button>
            <ChevronRight className="h-3.5 w-3.5 flex-none text-db-faint" strokeWidth={2} />
          </div>
        ))}

        {tail.length > 0 ? (
          <div className="flex h-[92px] w-[166px] flex-none flex-col justify-between rounded-lg border border-db-green/25 bg-db-green-tint px-3.5 py-3">
            <CircleCheck className="h-4 w-4 text-db-green" strokeWidth={2} />
            <span className="line-clamp-2 text-[12.5px] font-medium leading-tight text-db-ink">
              {tail.length === 1 ? tail[0].name : "Final approvals & operations"}
            </span>
            <span className="flex items-center justify-between">
              <span className="font-num text-[12px] font-semibold text-db-ink">{tailDays} d</span>
              <span className="rounded-full bg-db-green/15 px-2 py-[2px] font-mono text-[9.5px] font-semibold tracking-[0.05em] text-db-green">
                {tail.length === 1 ? "FINAL" : `${tail.length} STEPS`}
              </span>
            </span>
          </div>
        ) : null}

        </div>

        <div className="flex w-[118px] flex-none flex-col justify-center border-l border-db-red-line pl-4">
          <span className="text-[11.5px] leading-tight text-db-muted">
            Total <span className="text-db-faint">(critical path)</span>
          </span>
          <span className="mt-1 text-[26px] font-semibold leading-none text-db-ink">
            {roadmap.optimised_days}{" "}
            <span className="text-[13px] font-normal text-db-muted">days</span>
          </span>
          <span className="mt-1.5 text-[11.5px] font-semibold text-db-green">
            ↓ {savedPct.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}
