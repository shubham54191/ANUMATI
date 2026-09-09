"use client";
import { memo } from "react";
import type { NodeProps, Node } from "@xyflow/react";
import { LANE_HEIGHT } from "@/lib/graph/layout";
import { cn } from "@/lib/utils";

export interface BatchLaneData extends Record<string, unknown> {
  day: number;
  count: number;
  width: number;
  striped: boolean;
  index: number;
}

export type BatchLaneType = Node<BatchLaneData, "batchLane">;

function BatchLaneImpl({ data }: NodeProps<BatchLaneType>) {
  return (
    <div
      className={cn(
        "anim-rise pointer-events-none relative border-b border-line/70",
        data.striped && "bg-ink/[0.016]",
      )}
      style={{
        width: data.width,
        height: LANE_HEIGHT,
        animationDelay: `${Math.min(data.index, 12) * 45}ms`,
      }}
    >
      <div className="absolute left-4 top-5 w-16">
        <div className="font-num font-mono text-[10.5px] font-semibold tracking-[0.04em] text-ink">
          DAY {data.day}
        </div>
        <div className="font-mono text-[8.5px] tracking-[0.06em] text-faint">
          {data.count} PARALLEL
        </div>
      </div>
    </div>
  );
}

export const BatchLane = memo(BatchLaneImpl);
