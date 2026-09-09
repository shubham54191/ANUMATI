import type { LeverImpact } from "@/types/simulation";
import { Label } from "@/components/ui/Card";
import { pct } from "@/lib/format/days";

export function HighestImpactCard({
  best,
  baseline,
}: {
  best: LeverImpact | undefined;
  baseline: number;
}) {
  if (!best || !best.days_saved) {
    return (
      <div className="flex-1 border-r border-line bg-surface px-[22px] py-4">
        <Label className="mb-2 block">Single highest-impact reform</Label>
        <p className="text-[12.5px] leading-relaxed text-muted">
          No single lever moves the finish date. Every candidate sits off the critical path — which
          is itself the finding to report.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 border-r border-line bg-surface px-[22px] py-4">
      <Label className="mb-2 block text-critical">Single highest-impact reform</Label>
      <p className="mb-2 text-[15px] font-medium leading-snug text-ink">{best.lever.label}</p>
      <p className="mb-2.5 text-xs leading-relaxed text-muted">{best.lever.rationale}</p>
      <div className="flex items-baseline gap-2">
        <span className="font-num font-serif text-[28px] font-medium text-critical">
          {best.days_saved}
        </span>
        <span className="text-xs text-muted">
          days · {pct(best.days_saved, baseline)} of the whole journey
        </span>
      </div>
    </div>
  );
}
