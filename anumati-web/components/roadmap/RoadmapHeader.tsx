"use client";
import type { Roadmap } from "@/types/roadmap";
import type { ApprovalEvidence } from "@/types/report";
import { useRoadmapStore } from "@/store/useRoadmapStore";
import { ClockToggle } from "./ClockToggle";
import { pct } from "@/lib/format/days";
import { StatTile } from "./StatTile";
import { TimeCollapse } from "./TimeCollapse";

export function RoadmapHeader({
  roadmap,
  evidence,
}: {
  roadmap: Roadmap;
  evidence: Record<string, ApprovalEvidence>;
}) {
  const saved = roadmap.sequential_days - roadmap.optimised_days;
  const departments = new Set(roadmap.approvals.map((a) => a.department_id)).size;
  const basis = useRoadmapStore((s) => s.clockBasis);
  const observed = basis === "observed";

  return (
    <div className="flex-none border-b border-line bg-surface">
      <div className="flex h-[100px] items-stretch px-5">
        <div className="pr-9">
          <StatTile
            label="Approvals"
            value={roadmap.approvals.length}
            unit={`across ${departments} departments`}
            delay={0}
          />
        </div>
        <div className="my-[22px] w-px bg-line" />
        <div className="px-9">
          <StatTile
            label={observed ? "Sequentially · observed" : "If done sequentially"}
            value={roadmap.sequential_days}
            unit="days"
            tone="muted"
            delay={80}
          />
        </div>
        <div className="my-[22px] w-px bg-line" />
        <div className="px-9">
          <StatTile
            label={observed ? "Critical path · observed" : "Optimised · critical path"}
            value={roadmap.optimised_days}
            unit="days"
            tone="emphasis"
            delay={160}
          />
        </div>
        <div className="my-[22px] w-px bg-line" />
        <div className="px-9">
          <StatTile
            label="Saved by parallelising"
            value={saved}
            unit="days"
            note={`−${pct(saved, roadmap.sequential_days)}`}
            tone="accent"
            delay={240}
          />
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-6 self-center">
          <ClockToggle evidence={evidence} />
        </div>
      </div>

      <TimeCollapse
        sequential={roadmap.sequential_days}
        optimised={roadmap.optimised_days}
      />
    </div>
  );
}
