"use client";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Database,
  Gavel,
  MessageSquare,
  MessageSquareWarning,
  Send,
} from "lucide-react";
import type { ApplicationFile, EventKind } from "@/types/matrix";
import { clockOf } from "@/lib/matrix/engine";
import { Label } from "@/components/ui/Card";
import { LedgerPanel } from "@/components/ledger/LedgerPanel";
import { useMatrixStore } from "@/store/useMatrixStore";
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
  query: MessageSquareWarning,
};

const TONE: Record<EventKind, string> = {
  dispatch: "text-db-blue",
  decision: "text-db-ink",
  conflict: "text-db-red",
  sla_warning: "text-db-amber",
  escalation: "text-db-amber",
  deemed: "text-db-amber",
  resolution: "text-db-blue",
  data: "text-db-muted",
  message: "text-db-muted",
  query: "text-db-amber",
};

/** The file's own record. Nothing the console does happens off the books. */
export function AuditTrail({ app }: { app: ApplicationFile }) {
  const events = [...app.events].reverse();
  const live = useMatrixStore((s) => s.mode) === "live";

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-none items-center gap-2 border-b border-db-line px-4 py-2.5">
        <Label>Audit trail</Label>
        <div className="flex-1" />
        <span className="font-mono text-[10.5px] text-db-faint">{events.length} entries · newest first</span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {live ? (
          <div className="mb-4">
            <LedgerPanel app={app} compact />
          </div>
        ) : (
          <p className="mb-3 rounded-lg border border-db-line bg-db-bg px-2.5 py-2 text-[11px] leading-snug text-db-muted">
            Demo mode: this trail lives in the browser. With the server connected, every entry is also written to a
            hash-chained ledger that anyone signed in can verify.
          </p>
        )}
        {events.length === 0 ? (
          <p className="text-[12px] text-db-muted">Nothing has happened on this file yet.</p>
        ) : null}

        <ol className="flex flex-col">
          {events.map((e, i) => {
            const Icon = ICON[e.kind];
            return (
              <li key={e.id} className="flex gap-2.5">
                <div className="flex flex-none flex-col items-center">
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 items-center justify-center rounded-full border border-db-line bg-surface",
                      TONE[e.kind],
                    )}
                  >
                    <Icon className="h-3 w-3" strokeWidth={1.7} />
                  </span>
                  {i < events.length - 1 ? <span className="w-px flex-1 bg-db-line" /> : null}
                </div>

                <div className="min-w-0 flex-1 pb-4">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-mono text-[10.5px] font-semibold tracking-[0.05em] text-db-ink">
                      {e.actor}
                    </span>
                    <span className="flex-none font-num font-mono text-[10px] text-db-faint">
                      d{e.day} · {clockOf(e.at)}
                    </span>
                  </div>
                  <p className={cn("mt-0.5 text-[12px] leading-relaxed", TONE[e.kind])}>{e.body}</p>
                  {e.authority ? (
                    <p className="mt-1 font-mono text-[10px] leading-snug text-db-faint">{e.authority}</p>
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
