"use client";
import { Check, Lock } from "lucide-react";
import type { LeverImpact } from "@/types/simulation";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<string, string> = {
  reduce_timeline: "REDUCE TIMELINE",
  parallelise: "PARALLELISE",
  enforce_deemed: "ENFORCE DEEMED",
  remove_approval: "REMOVE APPROVAL",
};

export function LeverRow({
  impact,
  selected,
  maxSaved,
  onToggle,
}: {
  impact: LeverImpact;
  selected: boolean;
  maxSaved: number;
  onToggle: () => void;
}) {
  const { lever, days_saved, illegal, reason } = impact;
  const saved = days_saved ?? 0;
  const barWidth = maxSaved > 0 ? Math.round((saved / maxSaved) * 132) : 0;

  return (
    <button
      onClick={illegal ? undefined : onToggle}
      disabled={illegal}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-3 border-b border-line px-5 py-3.5 text-left",
        illegal ? "cursor-not-allowed" : "hover:bg-sunk",
      )}
    >
      <span
        className={cn(
          "mt-px flex h-4 w-4 flex-none items-center justify-center rounded-sm border",
          illegal
            ? "border-line bg-sunk"
            : selected
              ? "border-ink bg-ink"
              : "border-line-strong bg-surface",
        )}
      >
        {illegal ? (
          <Lock className="h-2.5 w-2.5 text-faint" strokeWidth={1.6} />
        ) : selected ? (
          <Check className="h-2.5 w-2.5 text-white" strokeWidth={2.4} />
        ) : null}
      </span>

      <span className="min-w-0 flex-1">
        <span className="mb-1.5 flex items-center gap-2">
          <span
            className={cn(
              "text-[13px] font-medium",
              illegal ? "text-faint line-through" : "text-ink",
            )}
          >
            {lever.label}
          </span>
          <span
            className={cn(
              "inline-flex h-[17px] flex-none items-center rounded-sm border px-1.5 font-mono text-[10px] tracking-[0.07em]",
              illegal ? "border-line-strong bg-sunk text-faint" : "border-line bg-bg text-muted",
            )}
          >
            {illegal ? "REFUSED" : KIND_LABEL[lever.kind]}
          </span>
        </span>
        <span className="block pr-4 text-[11.5px] leading-relaxed text-muted">
          {illegal ? `${reason}. ${lever.rationale}` : lever.rationale}
        </span>
      </span>

      <span className="flex w-[190px] flex-none items-center justify-end gap-2.5 pt-0.5">
        {!illegal ? (
          <span
            className="h-1.5 flex-none rounded-[1px]"
            style={{
              width: barWidth,
              background: selected ? "var(--critical)" : "var(--border)",
            }}
          />
        ) : null}
        <span
          className={cn(
            "font-num w-[52px] flex-none text-right font-mono text-xs",
            illegal
              ? "text-faint"
              : selected && saved > 0
                ? "font-semibold text-critical"
                : "text-faint",
          )}
        >
          {illegal ? "refused" : saved > 0 ? `−${saved} d` : "0 d"}
        </span>
      </span>
    </button>
  );
}
