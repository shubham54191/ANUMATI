import { CalendarRange } from "lucide-react";
import type { Roadmap } from "@/types/roadmap";

export function TimeSavedCard({ roadmap }: { roadmap: Roadmap }) {
  const fill = Math.max(
    4,
    Math.round((roadmap.optimised_days / Math.max(roadmap.sequential_days, 1)) * 100),
  );

  return (
    <div className="rounded-xl border border-db-line bg-surface px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-db-blue-tint">
          <CalendarRange className="h-[17px] w-[17px] text-db-blue" strokeWidth={1.8} />
        </span>
        <div>
          <div className="text-[14px] font-semibold leading-tight text-db-ink">
            From {roadmap.sequential_days} to {roadmap.optimised_days} days
          </div>
          <div className="text-[12px] text-db-muted">Smarter process. Faster growth.</div>
        </div>
      </div>

      <div className="mt-4 h-[7px] w-full overflow-hidden rounded-full bg-db-blue-tint">
        <div className="h-full rounded-full bg-db-blue" style={{ width: `${fill}%` }} />
      </div>
    </div>
  );
}
