import type { Batch } from "@/types/roadmap";

export const NODE_WIDTH = 200;
export const NODE_HEIGHT = 76;
export const NODE_GAP = 40;

export const LANE_HEIGHT = 150;
export const LANE_GUTTER = 120;

export const CRITICAL_COLUMN = 0;

export function columnX(column: number): number {
  return LANE_GUTTER + column * (NODE_WIDTH + NODE_GAP);
}

export function widestColumns(batches: Batch[], criticalPath: string[]): number {
  const critical = new Set(criticalPath);
  return Math.max(
    ...batches.map((b) => {
      const hasCritical = b.approvals.some((id) => critical.has(id));
      const others = b.approvals.filter((id) => !critical.has(id)).length;
      return (hasCritical ? 1 : 1) + others;
    }),
  );
}
