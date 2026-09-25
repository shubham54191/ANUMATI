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
import { GraphControls } from "./GraphControls";
import { GraphLegend } from "./GraphLegend";
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
  const graphView = useRoadmapStore((s) => s.graphView);
  const { nodes, edges } = useGraphLayout(roadmap, selectedId, hoveredId);

  /**
   * "Critical Path" draws only the chain that sets the finish date; the other
   * edges are hidden rather than restyled, because a dimmed edge at this
   * density still reads as a line and defeats the point of the switch.
   */
  const shownEdges = useMemo(() => {
    if (graphView === "all") return edges;
    const critical = new Set(roadmap.critical_path);
    return edges.filter((e) => critical.has(e.source) && critical.has(e.target));
  }, [edges, graphView, roadmap.critical_path]);

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

  /**
   * The old default was a fixed { x: 40, y: 20, zoom: 0.82 }, chosen by eye
   * against a six-lane mockup. The real rule base produces up to nine
   * approvals in a single day-0 row, and at a flat 0.82 that row runs off
   * the right edge of the screen with no scrollbar or hint that anything is
   * missing — cards get sliced mid-word. fitView's own zoom-to-fit-everything
   * makes the opposite mistake: thirteen lanes tall pushes it down to ~0.3
   * and nothing is legible.
   *
   * So: fit to the actual WIDEST row, not a guess and not the whole graph.
   * Recomputed whenever the row width changes (new roadmap, a condition
   * toggle that adds/removes approvals) or the pane is resized.
   */
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { setViewport } = useReactFlow();
  const laneWidth = useMemo(
    () => columnX(widestColumns(roadmap.batches, roadmap.critical_path)) + NODE_WIDTH,
    [roadmap.batches, roadmap.critical_path],
  );

  const fitWidth = useCallback(() => {
    const available = wrapperRef.current?.clientWidth;
    if (!available) return;
    /* Floor at 0.62: below that the node text stops being readable, and an
       unreadable-but-complete graph is worth less than a readable one you
       pan. Above the floor it still fits the widest row exactly. */
    const zoom = Math.min(0.82, Math.max(0.62, (available - 64) / laneWidth));
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

  /* The board's two header buttons, driven through the store so the canvas
     keeps ownership of its own viewport. */
  const fitSignal = useRoadmapStore((s) => s.fitSignal);
  const expandSignal = useRoadmapStore((s) => s.expandSignal);
  const { fitView } = useReactFlow();

  useEffect(() => {
    if (fitSignal > 0) fitView({ duration: 320, padding: 0.06 });
  }, [fitSignal, fitView]);

  useEffect(() => {
    if (expandSignal > 0) setViewport({ x: 40, y: 20, zoom: 0.82 }, { duration: 320 });
  }, [expandSignal, setViewport]);

  return (
    <div ref={wrapperRef} className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={shownEdges}
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
        className="bg-surface"
      >
        <Panel position="bottom-left" className="m-4">
          <GraphControls />
        </Panel>
        <Panel position="bottom-right" className="m-4">
          <GraphLegend />
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
