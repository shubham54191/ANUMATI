"use client";
import { useReactFlow } from "@xyflow/react";
import { Plus, Minus, Maximize2 } from "lucide-react";

export function GraphControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const btn =
    "flex h-7 w-7 items-center justify-center text-ink hover:bg-sunk focus-visible:outline-none";
  return (
    <div className="flex flex-col overflow-hidden rounded border border-line bg-surface">
      <button onClick={() => zoomIn()} aria-label="Zoom in" className={`${btn} border-b border-line`}>
        <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
      <button onClick={() => zoomOut()} aria-label="Zoom out" className={`${btn} border-b border-line`}>
        <Minus className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
      <button onClick={() => fitView({ padding: 0.12 })} aria-label="Fit to view" className={btn}>
        <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.5} />
      </button>
    </div>
  );
}
