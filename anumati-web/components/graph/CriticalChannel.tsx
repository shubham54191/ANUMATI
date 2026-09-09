"use client";
import { memo } from "react";
import type { Node, NodeProps } from "@xyflow/react";

export interface CriticalChannelData extends Record<string, unknown> {
  height: number;
}
export type CriticalChannelType = Node<CriticalChannelData, "criticalChannel">;

function CriticalChannelImpl({ data }: NodeProps<CriticalChannelType>) {
  return (
    <div
      className="pointer-events-none rounded-sm"
      style={{
        height: data.height,
        background: "rgba(220, 38, 38, 0.035)",
        borderLeft: "1px solid rgba(220, 38, 38, 0.18)",
        borderRight: "1px solid rgba(220, 38, 38, 0.18)",
      }}
    />
  );
}

export const CriticalChannel = memo(CriticalChannelImpl);
