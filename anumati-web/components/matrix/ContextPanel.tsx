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
  { id: "data", label: "Data matrix" },
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
    <aside className="flex w-[392px] flex-none flex-col border-l border-line bg-surface">
      <div className="flex h-[52px] flex-none items-center gap-1 border-b border-line px-3">
        {TABS.map((t) => {
          const count = badge(t.id);
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className={cn(
                "flex h-8 items-center gap-1.5 rounded-sm px-2.5 text-[12px] transition-colors",
                tab === t.id
                  ? "border border-accent/30 bg-accent-muted font-medium text-accent"
                  : "text-muted hover:text-accent",
              )}
            >
              {t.label}
              {count ? (
                <span
                  className={cn(
                    "flex h-[15px] min-w-[15px] items-center justify-center rounded-full px-1 font-mono text-[9.5px] font-medium",
                    t.id === "data"
                      ? "bg-critical text-white"
                      : t.id === "sla"
                        ? "bg-state-deemed text-white"
                        : "bg-line-strong text-ink",
                  )}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1">
        {tab === "thread" ? <ClarificationThread app={app} derived={derived} /> : null}
        {tab === "data" ? <DataMatrixPanel app={app} /> : null}
        {tab === "sla" ? <SlaBoard app={app} /> : null}
        {tab === "audit" ? <AuditTrail app={app} /> : null}
      </div>
    </aside>
  );
}
