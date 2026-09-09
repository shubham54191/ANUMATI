"use client";
import { cn } from "@/lib/utils";
import { useCountUp } from "@/hooks/useCountUp";

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
    default: { label: "", value: "text-ink", size: "text-[40px]" },
    muted: { label: "", value: "text-faint", size: "text-[40px]" },
    emphasis: { label: "text-ink", value: "text-ink font-medium", size: "text-[44px]" },
    accent: { label: "text-accent", value: "text-accent", size: "text-[40px]" },
  }[tone];

  return (
    <div className="flex flex-col justify-center gap-0.5">
      <span className={cn("label", tones.label)}>{label}</span>
      <div className="flex items-baseline gap-1.5">
        <span className={cn("font-num font-serif leading-none", tones.size, tones.value)}>
          {shown}
        </span>
        {unit ? (
          <span className={cn("text-xs", tone === "accent" ? "text-accent" : "text-muted")}>
            {unit}
          </span>
        ) : null}
        {note ? <span className="font-num ml-1 font-mono text-[11px] text-faint">{note}</span> : null}
      </div>
    </div>
  );
}
