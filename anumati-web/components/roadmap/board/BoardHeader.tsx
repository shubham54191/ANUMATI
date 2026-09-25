"use client";
import { ClipboardList, Leaf } from "lucide-react";
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
    hint: "Single-window facilitation officer. Can run reform simulations.",
  },
];

export function BoardHeader({ subtitle, stage }: { subtitle: string; stage: string }) {
  const viewMode = useRoadmapStore((s) => s.viewMode);
  const setViewMode = useRoadmapStore((s) => s.setViewMode);

  return (
    <div className="flex flex-wrap items-center gap-4">
      <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-db-blue-tint">
        <ClipboardList className="h-[22px] w-[22px] text-db-blue" strokeWidth={1.7} />
      </span>

      <div className="min-w-0">
        <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.01em] text-db-ink">
          Project Roadmap
        </h1>
        <p className="mt-0.5 truncate text-[13px] text-db-muted">{subtitle}</p>
      </div>

      <div className="flex-1" />

      <span className="inline-flex flex-none items-center gap-2 rounded-full border border-db-green/25 bg-db-green-tint px-3.5 py-2 text-[12.5px] font-medium text-db-ink">
        <Leaf className="h-[15px] w-[15px] text-db-green" strokeWidth={1.8} />
        {stage}
      </span>

      <div className="flex flex-none items-center gap-2" role="group" aria-label="Whose view">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setViewMode(m.id)}
            aria-pressed={viewMode === m.id}
            title={m.hint}
            className={cn(
              "flex h-9 items-center gap-2 rounded-lg border px-3.5 text-[12.5px] transition-colors",
              viewMode === m.id
                ? "border-db-blue/30 bg-db-blue-tint font-semibold text-db-blue"
                : "border-db-line bg-surface text-db-muted hover:text-db-ink",
            )}
          >
            {m.label}
            <kbd
              className={cn(
                "rounded px-1 font-mono text-[10px]",
                viewMode === m.id ? "bg-surface/70 text-db-blue" : "bg-db-bg text-db-faint",
              )}
            >
              {m.key}
            </kbd>
          </button>
        ))}
      </div>
    </div>
  );
}
