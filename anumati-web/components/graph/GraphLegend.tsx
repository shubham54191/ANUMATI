import { EDGE_SPEC } from "@/lib/constants/edgeTypes";
import { EDGE_TYPES } from "@/types/dependency";
import { Label } from "@/components/ui/Card";

function Line({ color, width, dashed }: { color: string; width: number; dashed: boolean }) {
  return (
    <svg width="22" height="6" className="flex-none" aria-hidden>
      <path
        d="M0 3h22"
        stroke={color}
        strokeWidth={width}
        strokeDasharray={dashed ? "4 4" : undefined}
      />
    </svg>
  );
}

export function GraphLegend() {
  return (
    <div className="rounded border border-line bg-surface px-3 py-2.5">
      <Label className="mb-2 block">Dependency type</Label>
      <div className="flex flex-col gap-1.5">
        {EDGE_TYPES.map((t) => {
          const spec = EDGE_SPEC[t];
          return (
            <div key={t} className="flex items-center gap-2" title={spec.blurb}>
              <Line color={`var(${spec.colorVar})`} width={spec.strokeWidth} dashed={spec.dashed} />
              <span className="text-[11.5px] text-ink">{spec.label}</span>
              <span className="font-num ml-auto font-mono text-[10px] text-faint">
                {spec.confidence.toFixed(2)}
              </span>
            </div>
          );
        })}
        <div className="my-0.5 h-px bg-line" />
        <div className="flex items-center gap-2">
          <Line color="var(--critical)" width={2.5} dashed={false} />
          <span className="text-[11.5px] font-medium text-critical">Critical path</span>
        </div>
      </div>
    </div>
  );
}
