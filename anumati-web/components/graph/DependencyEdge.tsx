"use client";
import { memo } from "react";
import { BaseEdge, getSmoothStepPath, type EdgeProps, type Edge } from "@xyflow/react";
import type { EdgeType } from "@/types/dependency";
import { edgeStroke } from "@/lib/graph/edgeStyles";

export interface DependencyEdgeData extends Record<string, unknown> {
  edgeType: EdgeType;
  isCritical: boolean;
  rationale: string;
  dimmed: boolean;
  emphasised: boolean;
}

export type DependencyEdgeType = Edge<DependencyEdgeData, "dependencyEdge">;

function DependencyEdgeImpl({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<DependencyEdgeType>) {
  const [path] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 12,
  });
  const stroke = edgeStroke(data?.edgeType ?? "statutory", Boolean(data?.isCritical));

  return (
    <BaseEdge
      id={id}
      path={path}
      markerEnd={markerEnd}
      style={{
        stroke: stroke.stroke,
        strokeWidth: data?.emphasised ? stroke.strokeWidth + 1 : stroke.strokeWidth,
        strokeDasharray: stroke.strokeDasharray,
        opacity: data?.dimmed ? 0.12 : 1,
      }}
    />
  );
}

export const DependencyEdge = memo(DependencyEdgeImpl);
