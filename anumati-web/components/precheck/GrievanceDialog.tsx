"use client";
import { useEffect, useState } from "react";
import { Scale } from "lucide-react";
import type { ApprovalReadiness } from "@/types/compliance";
import { useGrievanceStore } from "@/store/useGrievanceStore";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Label } from "@/components/ui/Card";

/**
 * The applicant's one remedy that leaves the department.
 *
 * The Empowered Committee may call for the reasons behind a delay or a
 * rejection and inquire into a grievance raised by an applicant (MAITRI Act,
 * 2023 — s. 8). This is that button. It does not decide the application: the
 * Committee still disposes of it under the relevant law.
 */
export function GrievanceDialog({
  readiness,
  onClose,
}: {
  readiness: ApprovalReadiness | null;
  onClose: () => void;
}) {
  const raise = useGrievanceStore((s) => s.raise);
  const hydrate = useGrievanceStore((s) => s.hydrate);
  const [reason, setReason] = useState("");
  const [days, setDays] = useState("30");
  const [sent, setSent] = useState(false);

  useEffect(() => hydrate(), [hydrate]);
  useEffect(() => {
    if (readiness) {
      setSent(false);
      setReason("");
    }
  }, [readiness]);

  if (!readiness) return null;

  const submit = () => {
    raise({
      approval_id: readiness.approval_id,
      approval_name: readiness.name,
      department_short: readiness.department_short,
      applicant: "Sahyadri Agro Foods Pvt Ltd",
      days_pending: Number(days) || 0,
      reason: reason.trim() || "No reason recorded.",
    });
    setSent(true);
  };

  return (
    <Dialog open onClose={onClose} title="Raise a grievance">
      {sent ? (
        <div className="py-1">
          <p className="mb-3 text-[13px] leading-relaxed text-ink">
            Recorded against {readiness.approval_id} and placed on the Empowered Committee&apos;s
            queue. The Committee may call for the department&apos;s reasons and inquire into the
            delay. It still decides the application under the same Act the department would have
            applied.
          </p>
          <p className="mb-4 font-mono text-[10.5px] text-muted">
            MAITRI Act, 2023 — s. 8
          </p>
          <Button variant="primary" onClick={onClose}>
            Close
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded border border-line bg-sunk px-3 py-2.5">
            <span className="font-mono text-[11px] font-semibold text-ink">
              {readiness.approval_id}
            </span>
            <span className="ml-2 text-[12.5px] text-ink">{readiness.name}</span>
            <div className="mt-0.5 text-[11.5px] text-muted">{readiness.department_short}</div>
          </div>

          <label className="flex items-center gap-2.5">
            <Label id="days-pending">Days pending</Label>
            <input
              aria-labelledby="days-pending"
              value={days}
              onChange={(e) => setDays(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
              inputMode="numeric"
              className="h-8 w-[84px] rounded border border-control bg-surface px-2 font-mono text-[12.5px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
            />
          </label>

          <div>
            <Label className="mb-2 block" id="reason-label">
              What has happened
            </Label>
            <textarea
              aria-labelledby="reason-label"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="No written query has been issued and the limit has lapsed."
              className="w-full rounded border border-control bg-surface px-3 py-2 text-[12.5px] leading-relaxed text-ink outline-none placeholder:text-faint focus-visible:ring-2 focus-visible:ring-accent"
            />
          </div>

          <div className="flex items-start gap-2 rounded border border-accent/30 bg-accent-muted/40 px-3 py-2">
            <Scale className="mt-0.5 h-3 w-3 flex-none text-accent" strokeWidth={1.7} />
            <p className="text-[11.5px] leading-snug text-muted">
              Routed to the Empowered Committee chaired by the Development Commissioner
              (Industries), not back to the department that is holding the file.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button variant="primary" onClick={submit} disabled={!reason.trim()}>
              Send to the Empowered Committee
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
