"use client";
import { useRoadmapStore, type Pane } from "@/store/useRoadmapStore";
import { cn } from "@/lib/utils";

export function BoardTabs({ approvalCount }: { approvalCount: number }) {
  const pane = useRoadmapStore((s) => s.pane);
  const setPane = useRoadmapStore((s) => s.setPane);
  const graphView = useRoadmapStore((s) => s.graphView);
  const setGraphView = useRoadmapStore((s) => s.setGraphView);

  const TABS: { id: Pane; label: string }[] = [
    { id: "graph", label: "Roadmap & Dependencies" },
    { id: "track", label: "Timeline View" },
    { id: "register", label: `All Approvals (${approvalCount})` },
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 border-b border-db-line px-5">
      <div className="flex items-center gap-6" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={pane === t.id}
            onClick={() => setPane(t.id)}
            className={cn(
              "-mb-px flex h-[46px] items-center border-b-2 text-[13.5px] transition-colors",
              pane === t.id
                ? "border-db-blue font-semibold text-db-blue"
                : "border-transparent text-db-muted hover:text-db-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {pane === "graph" ? (
        <div className="flex items-center gap-2 pb-2 pt-1">
          <span className="text-[12px] text-db-muted">View</span>
          <div className="flex items-center gap-1 rounded-lg border border-db-line bg-db-bg p-0.5">
            {(
              [
                { id: "critical", label: "Critical Path" },
                { id: "all", label: "All Dependencies" },
              ] as const
            ).map((v) => (
              <button
                key={v.id}
                onClick={() => setGraphView(v.id)}
                aria-pressed={graphView === v.id}
                className={cn(
                  "h-7 rounded-lg px-3 text-[12px] transition-colors",
                  graphView === v.id
                    ? "bg-db-navy font-medium text-white"
                    : "text-db-muted hover:text-db-ink",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
