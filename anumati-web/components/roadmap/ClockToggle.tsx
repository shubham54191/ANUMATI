"use client";
import { BookMarked, Users } from "lucide-react";
import type { ApprovalEvidence } from "@/types/report";
import { coverage } from "@/lib/data/observed";
import { useRoadmapStore, type ClockBasis } from "@/store/useRoadmapStore";
import { Label } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const MODES: { id: ClockBasis; label: string; Icon: typeof Users; hint: string }[] = [
  {
    id: "statutory",
    label: "Statutory",
    Icon: BookMarked,
    hint: "The days each Act allows the department. What you are entitled to.",
  },
  {
    id: "observed",
    label: "Observed",
    Icon: Users,
    hint: "The median of what applicants reported actually waiting. What you should plan for.",
  },
];

/**
 * Two clocks, one graph.
 *
 * Every portal shows the statutory window, because it is the number the
 * department is willing to publish. The second clock is the one an applicant
 * needs: where the law allows 45 days and the median file took 92, the
 * critical path is somewhere else entirely, and a plan built on the first
 * number was never going to hold.
 *
 * Where nobody has reported a timing the statutory figure stands — silence is
 * not evidence that a department is fast — so the toggle always says how much
 * of the rule base the second clock can actually speak to.
 */
export function ClockToggle({ evidence }: { evidence: Record<string, ApprovalEvidence> }) {
  const basis = useRoadmapStore((s) => s.clockBasis);
  const setBasis = useRoadmapStore((s) => s.setClockBasis);
  const { covered, total, reports } = coverage(evidence);

  return (
    <div className="flex flex-col items-end gap-1">
      <div
        className="flex items-center gap-1.5 rounded border border-line bg-sunk p-0.5"
        role="group"
        aria-label="Which clock the roadmap is built on"
      >
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setBasis(m.id)}
            aria-pressed={basis === m.id}
            title={m.hint}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-sm px-3 text-xs transition-colors",
              basis === m.id
                ? "border border-accent/30 bg-accent-muted font-medium text-accent"
                : "text-muted hover:text-accent",
            )}
          >
            <m.Icon className="h-3 w-3" strokeWidth={1.5} />
            {m.label}
          </button>
        ))}
      </div>

      <span className="font-mono text-[10px] tracking-[0.04em] text-faint">
        {basis === "observed" ? (
          <>
            {covered}/{total} APPROVALS · {reports} REPORTS · MEDIAN
          </>
        ) : (
          <Label>EVERY DAY COUNT CITED TO A SECTION</Label>
        )}
      </span>
    </div>
  );
}
