import type { Roadmap } from "@/types/roadmap";
import { pct } from "@/lib/format/days";
import { StatTile } from "./StatTile";
import { EdgeTypeBreakdown } from "./EdgeTypeBreakdown";
import { TimeCollapse } from "./TimeCollapse";

export function RoadmapHeader({ roadmap }: { roadmap: Roadmap }) {
  const saved = roadmap.sequential_days - roadmap.optimised_days;
  const departments = new Set(roadmap.approvals.map((a) => a.department_id)).size;

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
            label="If done sequentially"
            value={roadmap.sequential_days}
            unit="days"
            tone="muted"
            delay={80}
          />
        </div>
        <div className="my-[22px] w-px bg-line" />
        <div className="px-9">
          <StatTile
            label="Optimised · critical path"
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
        <EdgeTypeBreakdown dependencies={roadmap.dependencies} />
      </div>

      <TimeCollapse
        sequential={roadmap.sequential_days}
        optimised={roadmap.optimised_days}
      />
    </div>
  );
}
