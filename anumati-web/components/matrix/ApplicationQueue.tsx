"use client";
import { AlertTriangle, Clock, Scale, ShieldAlert, SlidersHorizontal } from "lucide-react";
import type { ApplicationFile, MatrixRuleKind } from "@/types/matrix";
import { derive } from "@/lib/matrix/engine";
import { useMatrixStore } from "@/store/useMatrixStore";
import { Label } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const RULE_ICON: Record<MatrixRuleKind, typeof Scale> = {
  veto: ShieldAlert,
  escalation: Scale,
  weighted: SlidersHorizontal,
};

const RULE_SHORT: Record<MatrixRuleKind, string> = {
  veto: "VETO",
  escalation: "TIE-BREAK",
  weighted: "WEIGHTED",
};

function StatusLine({ app }: { app: ApplicationFile }) {
  const d = derive(app);

  if (app.resolution) {
    const map = {
      cleared: ["Phase cleared", "text-state-done-ink"],
      sent_for_revision: ["Sent for revision", "text-critical"],
      escalated: ["With the tie-breaker panel", "text-state-deemed-ink"],
      overruled: ["Rejection overruled — cleared", "text-state-done-ink"],
      sustained: ["Rejection sustained", "text-critical"],
      failed_score: ["Phase failed on score", "text-critical"],
    } as const;
    const [label, tone] = map[app.resolution.kind];
    return <span className={cn("font-mono text-[10.5px] font-medium tracking-[0.05em]", tone)}>{label.toUpperCase()}</span>;
  }
  if (!app.dispatched) {
    return <span className="font-mono text-[10.5px] tracking-[0.05em] text-muted">AWAITING DISPATCH</span>;
  }
  if (app.tie_breaker_open) {
    return (
      <span className="flex items-center gap-1 font-mono text-[10.5px] font-medium tracking-[0.05em] text-state-deemed-ink">
        <Scale className="h-3 w-3" strokeWidth={1.6} />
        WITH TIE-BREAKER
      </span>
    );
  }
  if (d.conflict) {
    return (
      <span className="flex items-center gap-1 font-mono text-[10.5px] font-medium tracking-[0.05em] text-critical">
        <AlertTriangle className="h-3 w-3" strokeWidth={1.6} />
        CONFLICT DETECTED
      </span>
    );
  }
  if (d.breachedSla.length > 0) {
    return (
      <span className="flex items-center gap-1 font-mono text-[10.5px] font-medium tracking-[0.05em] text-state-deemed-ink">
        <Clock className="h-3 w-3" strokeWidth={1.6} />
        {d.breachedSla.length} PAST SLA
      </span>
    );
  }
  return (
    <span className="font-mono text-[10.5px] tracking-[0.05em] text-state-active">
      {d.pending.length} DESK{d.pending.length === 1 ? "" : "S"} REVIEWING
    </span>
  );
}

export function ApplicationQueue() {
  const applications = useMatrixStore((s) => s.applications);
  const selectedId = useMatrixStore((s) => s.selectedId);
  const select = useMatrixStore((s) => s.select);

  return (
    <aside className="flex w-[268px] flex-none flex-col border-r border-line bg-surface">
      <div className="flex h-[52px] flex-none items-center justify-between border-b border-line px-4">
        <Label>My queue</Label>
        <span className="font-mono text-[11px] text-muted">{applications.length} files</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {applications.map((app) => {
          const d = derive(app);
          const Icon = RULE_ICON[app.rule.kind];
          const active = app.id === selectedId;
          return (
            <button
              key={app.id}
              onClick={() => select(app.id)}
              aria-current={active}
              className={cn(
                "block w-full border-b border-line px-4 py-3 text-left transition-colors",
                "hover:bg-sunk focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ink",
                active && "bg-sunk shadow-[inset_3px_0_0_var(--accent)]",
                !active && d.conflict && !app.resolution && "shadow-[inset_3px_0_0_var(--critical)]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] font-semibold tracking-[0.04em] text-ink">
                  {app.id}
                </span>
                <span
                  title={app.rule.label}
                  className="flex items-center gap-1 rounded-sm border border-line px-1.5 py-px font-mono text-[9.5px] tracking-[0.06em] text-muted"
                >
                  <Icon className="h-2.5 w-2.5" strokeWidth={1.6} />
                  {RULE_SHORT[app.rule.kind]}
                </span>
              </div>

              <div className="mt-1.5 line-clamp-2 text-[12.5px] font-medium leading-snug text-ink">
                {app.project}
              </div>
              <div className="mt-0.5 truncate text-[11.5px] text-muted">{app.applicant}</div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <StatusLine app={app} />
                <span className="font-num font-mono text-[10.5px] text-faint">
                  day {app.day}
                </span>
              </div>
            </button>
          );
        })}
      </div>

    </aside>
  );
}
