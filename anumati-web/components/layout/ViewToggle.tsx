"use client";
import { useRoadmapStore, type ViewMode } from "@/store/useRoadmapStore";
import { cn } from "@/lib/utils";

const MODES: { id: ViewMode; label: string; key: string; hint: string }[] = [
  {
    id: "applicant",
    label: "Applicant",
    key: "A",
    hint: "The person setting up the business. Opens on the graph. No reform tools.",
  },
  {
    id: "department",
    label: "Department",
    key: "D",
    hint: "Single-window facilitation officer. Opens on the register. Can run reform simulations.",
  },
];

export function ViewToggle() {
  const viewMode = useRoadmapStore((s) => s.viewMode);
  const setViewMode = useRoadmapStore((s) => s.setViewMode);

  return (
    <div
      className="flex items-center gap-1.5 rounded border border-line bg-sunk p-0.5"
      role="group"
      aria-label="Whose view"
    >
      {MODES.map((m) => (
        <button
          key={m.id}
          onClick={() => setViewMode(m.id)}
          aria-pressed={viewMode === m.id}
          title={m.hint}
          className={cn(
            "flex h-8 items-center gap-1.5 rounded-sm px-3 text-xs transition-colors",
            viewMode === m.id
              ? "border border-accent/30 bg-accent-muted font-medium text-accent"
              : "text-muted hover:text-accent",
          )}
        >
          {m.label}
          <kbd className="rounded-sm border border-line px-1 font-mono text-[10px] text-faint">
            {m.key}
          </kbd>
        </button>
      ))}
    </div>
  );
}
