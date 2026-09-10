"use client";
import { Printer } from "lucide-react";
import type { ApplicationFile } from "@/types/matrix";
import { useMatrixStore } from "@/store/useMatrixStore";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Label } from "@/components/ui/Card";

/**
 * What actually goes back to the applicant under Scenario A: the objections
 * that stopped the file, and — just as important — the clearances that did not,
 * so nobody re-files what has already been granted.
 */
export function RevisionPacketDialog({ app }: { app: ApplicationFile }) {
  const open = useMatrixStore((s) => s.packetOpen);
  const setOpen = useMatrixStore((s) => s.setPacketOpen);

  const resolution = app.resolution;
  if (!resolution || resolution.kind !== "sent_for_revision") return null;
  const packet = resolution.packet;

  return (
    <Dialog open={open} onClose={() => setOpen(false)} title="Revision packet">
      <div className="flex flex-col gap-4">
        <div>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[11px] font-semibold tracking-[0.04em] text-ink">
              {packet.id}
            </span>
            <span className="font-mono text-[10.5px] text-muted">
              raised by {packet.raised_by.join(", ")} · day {resolution.day}
            </span>
          </div>
          <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
            Returned to {app.applicant} against {app.id}. The applicant has {packet.reply_days} days to
            correct and resubmit; the phase resumes where it stopped rather than starting again.
          </p>
        </div>

        <div>
          <Label className="mb-1.5 block text-critical">To be corrected</Label>
          <div className="flex flex-col gap-2">
            {packet.objections.map((o, i) => (
              <div key={i} className="rounded border border-critical/40 bg-critical/[0.04] px-3 py-2">
                <span className="font-mono text-[10.5px] font-semibold tracking-[0.05em] text-critical">
                  {o.dept_short}
                </span>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink">{o.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-1.5 block text-state-done-ink">Carried forward — do not re-file</Label>
          <ul className="flex flex-col gap-1">
            {packet.carried_forward.map((c) => (
              <li key={c} className="text-[12.5px] leading-snug text-ink">
                · {c}
              </li>
            ))}
            {packet.carried_forward.length === 0 ? (
              <li className="text-[12.5px] text-muted">Nothing had cleared when the file was returned.</li>
            ) : null}
          </ul>
        </div>

        <div className="flex items-center gap-2 border-t border-line pt-3">
          <Button onClick={() => window.print()}>
            <Printer className="h-3 w-3" strokeWidth={1.5} />
            Print the packet
          </Button>
          <div className="flex-1" />
          <Button variant="primary" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
