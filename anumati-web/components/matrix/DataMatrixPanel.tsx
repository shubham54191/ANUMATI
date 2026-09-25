"use client";
import {
  Building2,
  CheckCircle2,
  Database,
  FileText,
  Landmark,
  Loader2,
  RefreshCw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { ApplicationFile, DataRecordState } from "@/types/matrix";
import { RECORD_META } from "@/lib/matrix/display";
import { useMatrixStore } from "@/store/useMatrixStore";
import { cn } from "@/lib/utils";

const RECORD_ICON: Record<DataRecordState, typeof FileText> = {
  idle: FileText,
  fetching: Loader2,
  verified: CheckCircle2,
  mismatch: XCircle,
  unavailable: ShieldCheck,
};

/** A stable icon per record, so a card keeps its face between fetches. */
const SHAPE = [CheckCircle2, FileText, ShieldCheck, Landmark, Building2];

/**
 * The shared data matrix.
 *
 * Where a department needs a fact another ministry already holds — a land
 * record, a tax standing, an antecedents check — the system fetches it instead
 * of asking the applicant to carry a certificate across town. A record that
 * comes back contradicting the file is the interesting case, and it is shown as
 * plainly as one that agrees.
 */
export function DataMatrixPanel({ app }: { app: ApplicationFile }) {
  const fetchRecord = useMatrixStore((s) => s.fetchRecord);
  const fetchAllRecords = useMatrixStore((s) => s.fetchAllRecords);

  const fetched = app.records.filter((r) => r.state !== "idle" && r.state !== "fetching").length;

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-none items-center gap-2.5 border-b border-db-line px-4 py-3">
        <span className="flex h-7 w-7 flex-none items-center justify-center rounded-lg bg-db-blue-tint">
          <Database className="h-3.5 w-3.5 text-db-blue" strokeWidth={2} />
        </span>
        <span className="text-[10.5px] font-bold leading-tight tracking-[0.07em] text-db-ink">
          SHARED DATA
          <br />
          MATRIX
        </span>
        <span className="font-num text-[12px] leading-tight text-db-muted">
          <span className="font-semibold text-db-ink">
            {fetched}/{app.records.length}
          </span>
          <br />
          fetched
        </span>
        <div className="flex-1" />
        <button
          onClick={fetchAllRecords}
          title="Call every ministry of record again"
          className="flex h-8 flex-none items-center gap-1.5 rounded-lg border border-db-line bg-surface px-3 text-[12px] font-medium text-db-ink transition-colors hover:border-db-blue/40 hover:text-db-blue"
        >
          <RefreshCw className="h-3 w-3" strokeWidth={2} />
          Re-validate all
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <p className="mb-3 rounded-lg border border-db-line bg-db-bg px-3 py-2 text-[11.5px] leading-snug text-db-muted">
          Background validation runs itself on dispatch — every record below was requested from the
          ministry of record without anyone asking for it.
        </p>

        <div className="flex flex-col gap-2.5">
          {app.records.map((r, i) => {
            const meta = RECORD_META[r.state];
            const Icon = r.state === "fetching" ? Loader2 : (SHAPE[i % SHAPE.length] ?? RECORD_ICON[r.state]);
            return (
              <div
                key={r.id}
                style={{ animationDelay: `${i * 60}ms` }}
                className={cn("db-rise db-lift rounded-xl border px-3.5 py-3", meta.card)}
              >
                <div className="flex items-start gap-2.5">
                  <span
                    className={cn(
                      "flex h-7 w-7 flex-none items-center justify-center rounded-lg",
                      meta.tile,
                    )}
                  >
                    <Icon
                      className={cn("h-3.5 w-3.5", r.state === "fetching" && "animate-spin")}
                      strokeWidth={2}
                    />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[12.5px] font-semibold leading-snug text-db-ink">
                        {r.label}
                      </span>
                      <span
                        className={cn(
                          "flex flex-none items-center gap-1.5 text-[9.5px] font-bold tracking-[0.05em]",
                          meta.text,
                        )}
                      >
                        <span className={cn("h-[6px] w-[6px] rounded-full", meta.dot)} />
                        {meta.label}
                      </span>
                    </div>

                    <div className="mt-1 truncate font-mono text-[10.5px] text-db-muted">
                      {r.source_short} · <span className="text-db-faint">{r.endpoint}</span>
                    </div>

                    {r.value ? (
                      <p
                        className={cn(
                          "mt-1.5 text-[12px] leading-relaxed",
                          r.state === "mismatch" ? "text-db-red" : "text-db-ink",
                        )}
                      >
                        {r.value}
                      </p>
                    ) : null}

                    <p className="mt-1.5 text-[11px] leading-snug text-db-muted">
                      Replaces: {r.replaces}
                    </p>

                    <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-db-line pt-2">
                      <span className="truncate text-[10.5px] text-db-faint">
                        Used by {r.consumers.join(", ")}
                      </span>
                      <button
                        onClick={() => fetchRecord(r.id)}
                        disabled={r.state === "fetching"}
                        className="flex h-6 flex-none items-center rounded-lg border border-db-line px-2 text-[10.5px] font-medium text-db-muted transition-colors hover:border-db-blue/40 hover:text-db-blue disabled:opacity-40"
                      >
                        {r.state === "idle" ? "Fetch" : "Re-fetch"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-[11.5px] leading-relaxed text-db-muted">
          Each fetch is written to the audit trail with its source and the moment it was made, because
          a decision taken on an automatically fetched record has to be as auditable as one taken on a
          piece of paper.
        </p>
      </div>
    </div>
  );
}
