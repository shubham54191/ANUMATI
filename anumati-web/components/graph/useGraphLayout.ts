"use client";
import { useMemo } from "react";
import type { Edge, Node } from "@xyflow/react";
import type { Roadmap } from "@/types/roadmap";
import { LANE_HEIGHT, NODE_WIDTH, columnX, widestColumns } from "@/lib/graph/layout";
import { criticalEdgeKeys } from "@/lib/graph/edgeStyles";
import type { ApprovalNodeData } from "./ApprovalNode";
import type { BatchLaneData } from "./BatchLane";
import type { CriticalChannelData } from "./CriticalChannel";
import type { DependencyEdgeData } from "./DependencyEdge";

export function useGraphLayout(
  roadmap: Roadmap,
  selectedId: string | null,
  hoveredId: string | null,
) {
  return useMemo(() => {
    const byId = new Map(roadmap.approvals.map((a) => [a.id, a]));
    const critical = new Set(roadmap.critical_path);
    const laneW = columnX(widestColumns(roadmap.batches, roadmap.critical_path));

    const focus = hoveredId;
    const related = new Set<string>();
    if (focus) {
      related.add(focus);
      for (const d of roadmap.dependencies) {
        if (d.from_approval_id === focus) related.add(d.to_approval_id);
        if (d.to_approval_id === focus) related.add(d.from_approval_id);
      }
    }

    const channel: Node<CriticalChannelData> = {
      id: "critical-channel",
      type: "criticalChannel",
      position: { x: columnX(0) - 16, y: -24 },
      data: { height: roadmap.batches.length * LANE_HEIGHT + 32 },
      draggable: false,
      selectable: false,
      zIndex: -2,
      style: {
        width: NODE_WIDTH + 32,
        height: roadmap.batches.length * LANE_HEIGHT + 32,
        pointerEvents: "none" as const,
      },
    };

    const laneNodes: Node<BatchLaneData>[] = roadmap.batches.map((batch, i) => ({
      id: `lane-${batch.day}`,
      type: "batchLane",
      position: { x: 0, y: i * LANE_HEIGHT },
      data: {
        day: batch.day,
        count: batch.approvals.length,
        width: laneW,
        striped: i % 2 === 0,
        index: i,
      },
      draggable: false,
      selectable: false,
      zIndex: -1,
      style: { width: laneW, height: LANE_HEIGHT, pointerEvents: "none" as const },
    }));

    const approvalNodes: Node<ApprovalNodeData>[] = roadmap.batches.flatMap(
      (batch, batchIndex) => {
        let nextColumn = 1; // column 0 is the critical channel
        return batch.approvals.map((id) => {
          const onCriticalPath = critical.has(id);
          const column = onCriticalPath ? 0 : nextColumn++;
          return {
            id,
            type: "approvalNode" as const,
            position: {
              x: columnX(column), // across = parallel
              y: batchIndex * LANE_HEIGHT + 42, // down = sequential
            },
            data: {
              approval: byId.get(id)!,
              // What the graph actually planned this node with. Under the
              // observed clock it is the reported median, so the number on the
              // card and the lane it sits in can never disagree.
              planningDays: (roadmap.earliest_finish[id] ?? 0) - batch.day,
              onCriticalPath,
              selected: selectedId === id,
              related: Boolean(focus) && related.has(id) && id !== focus,
              focused: focus === id,
              laneIndex: batchIndex,
            },
            draggable: false,
          };
        });
      },
    );

    const criticalKeys = criticalEdgeKeys(roadmap.critical_path);
    const edges: Edge<DependencyEdgeData>[] = roadmap.dependencies.map((d) => {
      const key = `${d.from_approval_id}->${d.to_approval_id}`;
      const isCritical = criticalKeys.has(key);
      const touchesFocus =
        !!focus && (d.from_approval_id === focus || d.to_approval_id === focus);
      return {
        id: key,
        source: d.from_approval_id,
        target: d.to_approval_id,
        type: "dependencyEdge",
        zIndex: touchesFocus ? 3 : isCritical ? 2 : 1,
        className: isCritical ? "edge-critical" : undefined,
        data: {
          edgeType: d.edge_type,
          isCritical,
          rationale: d.rationale,
          dimmed: Boolean(focus) && !touchesFocus,
          emphasised: touchesFocus,
        },
      };
    });

    return { nodes: [channel, ...laneNodes, ...approvalNodes], edges };
  }, [roadmap, selectedId, hoveredId]);
}
