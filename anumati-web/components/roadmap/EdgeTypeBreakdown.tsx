import type { Dependency } from "@/types/dependency";
import { EDGE_TYPES } from "@/types/dependency";
import { EDGE_SPEC } from "@/lib/constants/edgeTypes";
import { Label } from "@/components/ui/Card";

export function EdgeTypeBreakdown({ dependencies }: { dependencies: Dependency[] }) {
  const counts = EDGE_TYPES.map((t) => ({
    type: t,
    spec: EDGE_SPEC[t],
    n: dependencies.filter((d) => d.edge_type === t).length,
  }));

  return (
    <div className="my-5 flex flex-col justify-center gap-[7px] border-l border-line pl-9">
      <Label>Dependency evidence · {dependencies.length} edges</Label>
      <div className="flex items-center gap-[7px]">
        {counts.map(({ type, spec, n }) => (
          <span
            key={type}
            title={spec.blurb}
            className="flex h-[22px] items-center gap-1.5 rounded-sm border px-1.5"
            style={{
              borderColor: `var(${spec.colorVar})`,
              borderStyle: spec.dashed ? "dashed" : "solid",
              background: `color-mix(in srgb, var(${spec.colorVar}) 6%, transparent)`,
            }}
          >
            <span
              className="w-3.5"
              style={{
                height: spec.dashed ? 0 : spec.strokeWidth,
                borderTop: spec.dashed ? `1.5px dashed var(${spec.colorVar})` : undefined,
                background: spec.dashed ? undefined : `var(${spec.colorVar})`,
              }}
            />
            <span
              className="font-num font-mono text-[10.5px] font-medium"
              style={{ color: spec.dashed ? "var(--text-muted)" : `var(${spec.colorVar})` }}
            >
              {n} {spec.label.split(" —")[0].toLowerCase()}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
