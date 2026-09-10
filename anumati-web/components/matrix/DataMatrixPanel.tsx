"use client";
import { Database, Download, Loader2 } from "lucide-react";
import type { ApplicationFile } from "@/types/matrix";
import { RECORD_META } from "@/lib/matrix/display";
import { useMatrixStore } from "@/store/useMatrixStore";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

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
      <div className="flex flex-none items-center gap-2 border-b border-line px-4 py-2.5">
        <Database className="h-3.5 w-3.5 text-accent" strokeWidth={1.6} />
        <Label>Shared data matrix</Label>
        <span className="font-mono text-[10.5px] text-faint">
          {fetched}/{app.records.length} fetched
        </span>
        <div className="flex-1" />
        <Button onClick={fetchAllRecords} className="h-7 px-2.5" title="Call every ministry of record again">
          <Download className="h-3 w-3" strokeWidth={1.6} />
          Re-validate all
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <p className="mb-2.5 rounded border border-line bg-sunk px-2.5 py-1.5 text-[11.5px] leading-snug text-muted">
          Background validation runs itself on dispatch — every record below was requested from the
          ministry of record without anyone asking for it.
        </p>
        <div className="flex flex-col gap-2.5">
          {app.records.map((r) => {
            const meta = RECORD_META[r.state];
            return (
              <div
                key={r.id}
                className={cn(
                  "rounded border px-3 py-2.5",
                  r.state === "mismatch"
                    ? "border-critical/45 bg-critical/[0.04]"
                    : r.state === "verified"
                      ? "border-state-done/40 bg-state-done/[0.03]"
                      : "border-line bg-surface",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[12.5px] font-medium leading-snug text-ink">{r.label}</span>
                  <span className={cn("flex flex-none items-center gap-1.5 font-mono text-[9.5px] font-medium tracking-[0.06em]", meta.text)}>
                    {r.state === "fetching" ? (
                      <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />
                    ) : (
                      <span className={cn("h-[6px] w-[6px] rounded-full", meta.dot)} />
                    )}
                    {meta.label}
                  </span>
                </div>

                <div className="mt-1 font-mono text-[10.5px] text-muted">
                  {r.source_short} · <span className="text-faint">{r.endpoint}</span>
                </div>

                {r.value ? (
                  <p
                    className={cn(
                      "mt-1.5 text-[12px] leading-relaxed",
                      r.state === "mismatch" ? "text-critical" : "text-ink",
                    )}
                  >
                    {r.value}
                  </p>
                ) : null}

                <p className="mt-1.5 text-[11px] leading-snug text-muted">
                  Replaces: {r.replaces}
                </p>

                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-faint">
                    Used by {r.consumers.join(", ")}
                  </span>
                  <Button
                    onClick={() => fetchRecord(r.id)}
                    disabled={r.state === "fetching"}
                    className="h-6 px-2 text-[11px]"
                  >
                    {r.state === "idle" ? "Fetch" : "Re-fetch"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-4 text-[11.5px] leading-relaxed text-muted">
          Each fetch is written to the audit trail with its source and the moment it was made, because a
          decision taken on an automatically fetched record has to be as auditable as one taken on a piece
          of paper.
        </p>
      </div>
    </div>
  );
}
