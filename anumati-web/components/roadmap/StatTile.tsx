"use client";
import { cn } from "@/lib/utils";
import { useCountUp } from "@/hooks/useCountUp";

/**
 * One big number and a label. Serif numerals — this is a statement, not a chip.
 * The number ticks to its value on arrival and on every recompute, so a change
 * to the conditions above is felt rather than just displayed.
 */
export function StatTile({
  label,
  value,
  unit,
  note,
  tone = "default",
  delay = 0,
}: {
  label: string;
  value: number;
  unit?: string;
  note?: string;
  tone?: "default" | "muted" | "emphasis" | "accent";
  delay?: number;
}) {
  const shown = useCountUp(value, 900, delay);

  const tones = {
    default: { label: "", value: "text-db-ink", size: "text-[40px]" },
    muted: { label: "", value: "text-db-faint", size: "text-[40px]" },
    emphasis: { label: "text-db-ink", value: "text-db-ink font-medium", size: "text-[44px]" },
    accent: { label: "text-db-blue", value: "text-db-blue", size: "text-[40px]" },
  }[tone];

  return (
    <div className="flex flex-col justify-center gap-0.5">
      <span className={cn("label", tones.label)}>{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className={cn("font-num font-sans leading-none", tones.size, tones.value)}>
          {shown}
        </span>
        {unit ? (
          <span className={cn("text-xs", tone === "accent" ? "text-db-blue" : "text-db-muted")}>
            {unit}
          </span>
        ) : null}
        {note ? <span className="font-num ml-1 font-mono text-[11px] text-db-faint">{note}</span> : null}
      </div>
    </div>
  );
}
