"use client";
import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Card";
import type { Approval } from "@/types/approval";
import type { ReportKind } from "@/types/report";
import { useReportsStore } from "@/store/useReportsStore";

export function ReportRejectionDialog({
  approval,
  open,
  onClose,
}: {
  approval: Approval;
  open: boolean;
  onClose: () => void;
}) {
  const [kind, setKind] = useState<ReportKind>("extra_document");
  const [detail, setDetail] = useState("");
  const [days, setDays] = useState("");
  const [sent, setSent] = useState(false);
  const file = useReportsStore((s) => s.file);

  const timing = kind === "longer";

  const submit = () => {
    const parsed = Number(days);
    file({
      approval_id: approval.id,
      kind,
      observed_days: timing && days !== "" && !Number.isNaN(parsed) ? parsed : null,
      detail,
    });
    setSent(true);
  };

  const KINDS = [
    { id: "extra_document", label: "Asked for a document not on the list" },
    { id: "not_required", label: "This approval was not required at all" },
    { id: "wrong_order", label: "The order was different in practice" },
    { id: "longer", label: "It took materially longer than stated" },
  ];

  return (
    <Dialog open={open} onClose={onClose} title="Report what actually happened">
      {sent ? (
        <div className="py-2">
          <p className="mb-3 text-[13px] leading-relaxed text-ink">
            Recorded against {approval.id} and routed to the review queue. It counts towards the
            observed median straight away — open the approval and read it under{" "}
            <span className="font-medium">What applicants reported</span> — but it will not change
            the statutory rule until a verifier publishes a new version.
          </p>
          <Button onClick={onClose}>Close</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-[12.5px] leading-relaxed text-muted">
            {approval.name} · {approval.department_name}
          </p>

          <div>
            <Label className="mb-2 block">What happened</Label>
            <div className="flex flex-col gap-1.5">
              {KINDS.map((k) => (
                <label key={k.id} className="flex items-center gap-2.5 text-[12.5px] text-ink">
                  <input
                    type="radio"
                    name="kind"
                    value={k.id}
                    checked={kind === k.id}
                    onChange={() => setKind(k.id as ReportKind)}
                    className="accent-[var(--text)]"
                  />
                  {k.label}
                </label>
              ))}
            </div>
          </div>

          {timing ? (
            <label className="flex items-center gap-2.5">
              <Label id="days-label">Days you actually waited</Label>
              <input
                aria-labelledby="days-label"
                value={days}
                onChange={(e) => setDays(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
                inputMode="numeric"
                placeholder={String(approval.statutory_days)}
                className="h-8 w-[90px] rounded border border-control bg-surface px-2 font-mono text-[12.5px] text-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
              />
              <span className="text-[11.5px] text-muted">
                statutory window is {approval.statutory_days} days
              </span>
            </label>
          ) : null}

          <div>
            <Label className="mb-2 block" id="detail-label">
              In your words
            </Label>
            <textarea
              aria-labelledby="detail-label"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              rows={3}
              placeholder="The office asked for the consent fee challan in original."
              className="w-full rounded border border-line bg-surface px-3 py-2 text-[12.5px] text-ink placeholder:text-faint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink"
            />
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="primary"
              onClick={submit}
              disabled={!detail.trim() || (timing && days === "")}
            >
              Send to the review queue
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
