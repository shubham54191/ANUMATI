"use client";
import type { ApplicationFile, DerivedMatrixState } from "@/types/matrix";
import { useMatrixStore, type ContextTab } from "@/store/useMatrixStore";
import { AuditTrail } from "./AuditTrail";
import { ClarificationThread } from "./ClarificationThread";
import { DataMatrixPanel } from "./DataMatrixPanel";
import { SlaBoard } from "./SlaBoard";
import { cn } from "@/lib/utils";

const TABS: { id: ContextTab; label: string }[] = [
  { id: "thread", label: "Thread" },
  { id: "data", label: "Data Matrix" },
  { id: "sla", label: "SLA" },
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
      <div className="flex h-[54px] flex-none items-center gap-5 border-b border-db-line px-4">
        {TABS.map((t) => {
          const count = badge(t.id);
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-selected={active}
              role="tab"
              className={cn(
                "-mb-px flex h-[54px] items-center gap-1.5 border-b-2 text-[13px] transition-colors",
                active
                  ? "border-db-blue font-semibold text-db-blue"
                  : "border-transparent text-db-muted hover:text-db-ink",
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

      <div key={tab} className="db-rise min-h-0 flex-1">
        {tab === "thread" ? <ClarificationThread app={app} derived={derived} /> : null}
        {tab === "data" ? <DataMatrixPanel app={app} /> : null}
        {tab === "sla" ? <SlaBoard app={app} /> : null}
        {tab === "audit" ? <AuditTrail app={app} /> : null}
      </div>
    </aside>
  );
}
