"use client";
import type { ApplicationFile, DerivedMatrixState } from "@/types/matrix";
import { useMatrixStore, type ContextTab } from "@/store/useMatrixStore";
import { AuditTrail } from "./AuditTrail";
import { ClarificationThread } from "./ClarificationThread";
import { DataMatrixPanel } from "./DataMatrixPanel";
import { ParameterScope } from "./ParameterScope";
import { SlaBoard } from "./SlaBoard";
import { InspectionPlanner } from "./InspectionPlanner";
import { GrievanceQueue } from "./GrievanceQueue";
import { cn } from "@/lib/utils";

const TABS: { id: ContextTab; label: string }[] = [
  { id: "thread", label: "Thread" },
  { id: "data", label: "Data Matrix" },
  { id: "scope", label: "Scope" },
  { id: "sla", label: "SLA" },
  { id: "visits", label: "Visits" },
  { id: "redress", label: "Redress" },
  { id: "audit", label: "Audit" },
];

export function ContextPanel({
  app,
  derived,
}: {
  app: ApplicationFile;
  derived: DerivedMatrixState;
}) {
  const tab = useMatrixStore((s) => s.tab);
  const setTab = useMatrixStore((s) => s.setTab);

  const unread = app.thread.length;
  const mismatches = app.records.filter((r) => r.state === "mismatch").length;
  const breaches = derived.breachedSla.length + derived.escalated.length;

  const badge = (id: ContextTab) =>
    id === "thread" && unread > 0
      ? unread
      : id === "data" && mismatches > 0
        ? mismatches
        : id === "sla" && breaches > 0
          ? breaches
          : null;

  return (
    <aside className="flex w-[392px] flex-none flex-col border-l border-db-line bg-surface">
      <div
        role="tablist"
        aria-label="File context"
        className="flex h-[52px] flex-none items-center gap-1 overflow-x-auto border-b border-db-line px-2"
      >
        {TABS.map((t) => {
          const count = badge(t.id);
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              id={`ctx-tab-${t.id}`}
              onClick={() => setTab(t.id)}
              aria-selected={active}
              aria-controls="ctx-panel"
              role="tab"
              tabIndex={active ? 0 : -1}
              className={cn(
                "flex h-8 flex-none items-center gap-1 whitespace-nowrap rounded-sm px-2 text-[11.5px] transition-colors",
                active
                  ? "border border-db-blue/30 bg-db-blue-tint font-medium text-db-blue"
                  : "text-db-muted hover:text-db-ink",
              )}
            >
              {t.label}
              {count ? (
                <span
                  className={cn(
                    "flex h-[17px] min-w-[17px] items-center justify-center rounded-full px-1 text-[9.5px] font-bold",
                    t.id === "data"
                      ? "bg-db-red text-white"
                      : t.id === "sla"
                        ? "bg-db-amber text-white"
                        : active
                          ? "bg-db-blue text-white"
                          : "bg-db-bg text-db-muted",
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div
        key={tab}
        id="ctx-panel"
        role="tabpanel"
        aria-labelledby={`ctx-tab-${tab}`}
        className="db-rise min-h-0 flex-1"
      >
        {tab === "thread" ? <ClarificationThread app={app} derived={derived} /> : null}
        {tab === "data" ? <DataMatrixPanel app={app} /> : null}
        {tab === "scope" ? <ParameterScope app={app} /> : null}
        {tab === "sla" ? <SlaBoard app={app} /> : null}
        {tab === "visits" ? <InspectionPlanner app={app} /> : null}
        {tab === "redress" ? <GrievanceQueue /> : null}
        {tab === "audit" ? <AuditTrail app={app} /> : null}
      </div>
    </aside>
  );
}
