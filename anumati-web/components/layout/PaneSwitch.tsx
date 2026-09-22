"use client";
import { Files, GitBranch, Rows3, ShieldCheck, Workflow } from "lucide-react";
import { useRoadmapStore, type Pane } from "@/store/useRoadmapStore";
import { cn } from "@/lib/utils";

const PANES: { id: Pane; label: string; Icon: typeof Rows3 }[] = [
  { id: "graph", label: "Graph", Icon: GitBranch },
  { id: "register", label: "Checklist", Icon: Rows3 },
  { id: "documents", label: "Documents", Icon: Files },
  { id: "track", label: "Workflow", Icon: Workflow },
  { id: "precheck", label: "Pre-check", Icon: ShieldCheck },
];

export function PaneSwitch() {
  const pane = useRoadmapStore((s) => s.pane);
  const setPane = useRoadmapStore((s) => s.setPane);

  return (
    <div
      className="flex flex-none items-center gap-1.5 rounded border border-line bg-sunk p-0.5"
      role="group"
      aria-label="How to view the roadmap"
    >
      {PANES.map((p) => (
        <button
          key={p.id}
          onClick={() => setPane(p.id)}
          aria-pressed={pane === p.id}
          className={cn(
            "flex h-8 items-center gap-1.5 whitespace-nowrap rounded-sm px-3 text-[12px] transition-colors",
            pane === p.id
              ? "border border-accent/30 bg-accent-muted font-medium text-accent"
              : "text-muted hover:text-accent",
          )}
        >
          <p.Icon className="h-3 w-3" strokeWidth={1.5} />
          {p.label}
        </button>
      ))}
    </div>
  );
}
