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

/** The horizontal band behind one batch. Everything on it starts on the same day. */
function BatchLaneImpl({ data }: NodeProps<BatchLaneType>) {
  return (
    <div
      className={cn(
        "anim-rise pointer-events-none relative border-b border-db-line",
        data.striped && "bg-db-bg/70",
      )}
      style={{
        width: data.width,
        height: LANE_HEIGHT,
        animationDelay: `${Math.min(data.index, 12) * 45}ms`,
      }}
    >
      <div className="absolute left-3 top-4 flex w-[92px] items-start gap-2">
        <span className="mt-[5px] h-[7px] w-[7px] flex-none rounded-full bg-db-teal" />
        <span>
          <span className="font-num block text-[12px] font-semibold leading-tight text-db-ink">
            Day {data.day}
          </span>
          <span className="block text-[11px] leading-tight text-db-muted">Parallel</span>
        </span>
      </div>
    </div>
  );
}

export const BatchLane = memo(BatchLaneImpl);
