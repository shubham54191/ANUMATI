import { BookMarked, FlaskConical } from "lucide-react";
import type { MatrixRule } from "@/types/matrix";
import { cn } from "@/lib/utils";

/**
 * The citation under a decision-matrix row, and — where it applies — the
 * admission that the row is not law yet.
 *
 * The roadmap already separates what an Act requires from what a department
 * merely does, and only the second kind may be reformed away. A governance
 * rule deserves the same distinction: an enacted instrument and a clause
 * drafted for a pilot cannot look identical on screen, or the citation stops
 * meaning anything. A draft row still decides the file — it just says so.
 */
export function AuthorityLine({
  rule,
  className,
}: {
  rule: MatrixRule;
  className?: string;
}) {
  const draft = rule.authority_status === "draft";

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-start gap-2">
        {draft ? (
          <FlaskConical className="mt-0.5 h-3 w-3 flex-none text-accent-secondary" strokeWidth={1.7} />
        ) : (
          <BookMarked className="mt-0.5 h-3 w-3 flex-none text-muted" strokeWidth={1.6} />
        )}
        <span className="text-[11.5px] leading-snug text-muted">
          {rule.authority} — <span className="font-mono">{rule.authority_section}</span>
        </span>
        <span
          className={cn(
            "ml-auto flex-none rounded-sm border px-1.5 py-px font-mono text-[9.5px] font-medium tracking-[0.06em]",
            draft
              ? "border-accent-secondary/50 bg-accent-secondary/[0.08] text-accent-secondary"
              : "border-state-done/50 bg-state-done/[0.07] text-state-done-ink",
          )}
        >
          {draft ? "DRAFT — NOT NOTIFIED" : "IN FORCE"}
        </span>
      </div>

      {draft && rule.authority_note ? (
        <p className="pl-5 text-[11px] leading-snug text-faint">{rule.authority_note}</p>
      ) : null}
    </div>
  );
}
