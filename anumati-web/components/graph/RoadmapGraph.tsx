"use client";
import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Panel,
  useReactFlow,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Roadmap } from "@/types/roadmap";
import { useRoadmapStore } from "@/store/useRoadmapStore";
import { NODE_WIDTH, columnX, widestColumns } from "@/lib/graph/layout";
import { ApprovalNode } from "./ApprovalNode";
import { BatchLane } from "./BatchLane";
import { CriticalChannel } from "./CriticalChannel";
import { DependencyEdge } from "./DependencyEdge";
import { GraphLegend } from "./GraphLegend";
import { GraphControls } from "./GraphControls";
import { useGraphLayout } from "./useGraphLayout";

const nodeTypes = {
  approvalNode: ApprovalNode,
  batchLane: BatchLane,
  criticalChannel: CriticalChannel,
};
const edgeTypes = { dependencyEdge: DependencyEdge };

function Canvas({ roadmap }: { roadmap: Roadmap }) {
  const selectedId = useRoadmapStore((s) => s.selectedApprovalId);
  const hoveredId = useRoadmapStore((s) => s.hoveredApprovalId);
  const select = useRoadmapStore((s) => s.select);
  const hover = useRoadmapStore((s) => s.hover);
  const { nodes, edges } = useGraphLayout(roadmap, selectedId, hoveredId);

  const onNodeClick: NodeMouseHandler = useCallback(
    (_e, node) => {
      if (node.type !== "approvalNode") return;
      select(node.id === selectedId ? null : node.id);
    },
    [select, selectedId],
  );

  const onNodeMouseEnter: NodeMouseHandler = useCallback(
    (_e, node) => {
      if (node.type === "approvalNode") hover(node.id);
    },
    [hover],
  );

  const onNodeMouseLeave: NodeMouseHandler = useCallback(() => hover(null), [hover]);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const { setViewport } = useReactFlow();
  const laneWidth = useMemo(
    () => columnX(widestColumns(roadmap.batches, roadmap.critical_path)) + NODE_WIDTH,
    [roadmap.batches, roadmap.critical_path],
  );

  const fitWidth = useCallback(() => {
    const available = wrapperRef.current?.clientWidth;
    if (!available) return;
    const zoom = Math.min(0.82, Math.max(0.4, (available - 80) / laneWidth));
    setViewport({ x: 40, y: 20, zoom }, { duration: 0 });
  }, [laneWidth, setViewport]);

  useEffect(() => fitWidth(), [fitWidth]);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => fitWidth());
    observer.observe(el);
    return () => observer.disconnect();
  }, [fitWidth]);

  return (
    <div ref={wrapperRef} className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={onNodeClick}
        onNodeMouseEnter={onNodeMouseEnter}
        onNodeMouseLeave={onNodeMouseLeave}
        onPaneClick={() => select(null)}
        minZoom={0.3}
        maxZoom={1.6}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable
        proOptions={{ hideAttribution: true }}
        className="bg-bg"
      >
        <Panel position="bottom-left" className="m-5">
          <GraphControls />
        </Panel>
        <Panel position="bottom-right" className="m-5">
          <GraphLegend dependencies={roadmap.dependencies} />
        </Panel>
      </ReactFlow>
    </div>
  );
}

export function RoadmapGraph({ roadmap }: { roadmap: Roadmap }) {
  return (
    <ReactFlowProvider>
      <Canvas roadmap={roadmap} />
    </ReactFlowProvider>
  );
}
