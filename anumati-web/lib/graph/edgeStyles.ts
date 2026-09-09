import type { EdgeType } from "@/types/dependency";
import { EDGE_SPEC } from "@/lib/constants/edgeTypes";

export function edgeStroke(type: EdgeType, isCritical: boolean) {
  const spec = EDGE_SPEC[type];
  if (isCritical) {
    return {
      stroke: "var(--critical)",
      strokeWidth: 2.5,
      strokeDasharray: undefined as string | undefined,
    };
  }
  return {
    stroke: `var(${spec.colorVar})`,
    strokeWidth: spec.strokeWidth,
    strokeDasharray: spec.dashed ? "4 4" : undefined,
  };
}

/** Consecutive pairs on the critical path — these edges paint red. */
export function criticalEdgeKeys(path: string[]): Set<string> {
  const keys = new Set<string>();
  for (let i = 0; i < path.length - 1; i++) keys.add(`${path[i]}->${path[i + 1]}`);
  return keys;
}
