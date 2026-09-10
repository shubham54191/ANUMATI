"use client";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Database,
  Gavel,
  MessageSquare,
  Send,
} from "lucide-react";
import type { ApplicationFile, EventKind } from "@/types/matrix";
import { clockOf } from "@/lib/matrix/engine";
import { Label } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const ICON: Record<EventKind, typeof Send> = {
  dispatch: Send,
  decision: CheckCircle2,
  conflict: AlertTriangle,
  sla_warning: Clock,
  escalation: ArrowUpRight,
  deemed: Clock,
  resolution: Gavel,
  data: Database,
  message: MessageSquare,
};

const TONE: Record<EventKind, string> = {
  dispatch: "text-accent",
  decision: "text-ink",
  conflict: "text-critical",
  sla_warning: "text-accent-secondary",
  escalation: "text-state-deemed-ink",
  deemed: "text-state-deemed-ink",
  resolution: "text-accent",
  data: "text-muted",
  message: "text-muted",
};

/** The file's own record. Nothing the console does happens off the books. */
export function AuditTrail({ app }: { app: ApplicationFile }) {
  const events = [...app.events].reverse();

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-none items-center gap-2 border-b border-line px-4 py-2.5">
        <Label>Audit trail</Label>
        <div className="flex-1" />
        <span className="font-mono text-[10.5px] text-faint">{events.length} entries · newest first</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {events.length === 0 ? (
          <p className="text-[12px] text-muted">Nothing has happened on this file yet.</p>
        ) : null}

        <ol className="flex flex-col">
          {events.map((e, i) => {
            const Icon = ICON[e.kind];
            return (
              <li key={e.id} className="flex gap-2.5">
                <div className="flex flex-none flex-col items-center">
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-line bg-surface",
                      TONE[e.kind],
                    )}
                  >
                    <Icon className="h-3 w-3" strokeWidth={1.7} />
                  </span>
                  {i < events.length - 1 ? <span className="w-px flex-1 bg-line" /> : null}
                </div>

                <div className="min-w-0 flex-1 pb-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-mono text-[10.5px] font-semibold tracking-[0.05em] text-ink">
                      {e.actor}
                    </span>
                    <span className="flex-none font-num font-mono text-[10px] text-faint">
                      d{e.day} · {clockOf(e.at)}
                    </span>
                  </div>
                  <p className={cn("mt-0.5 text-[12px] leading-relaxed", TONE[e.kind])}>{e.body}</p>
                  {e.authority ? (
                    <p className="mt-1 font-mono text-[10px] leading-snug text-faint">{e.authority}</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
