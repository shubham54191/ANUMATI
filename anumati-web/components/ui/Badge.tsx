import * as React from "react";
import { cn } from "@/lib/utils";
import type { EdgeType } from "@/types/dependency";
import { EDGE_SPEC } from "@/lib/constants/edgeTypes";

export function Badge({
  className,
  tone = "neutral",
  dashed = false,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "critical" | "deemed" | "done" | "active" | "statutory";
  dashed?: boolean;
}) {
  const tones: Record<string, string> = {
    neutral: "border-line bg-bg text-faint",
    critical: "border-critical bg-critical/[0.06] text-critical",
    deemed: "border-state-deemed bg-state-deemed/[0.07] text-state-deemed",
    done: "border-state-done bg-state-done/[0.06] text-state-done",
    active: "border-edge-documentary bg-edge-documentary/[0.06] text-edge-documentary",
    statutory: "border-edge-statutory bg-edge-statutory/[0.06] text-edge-statutory",
  };
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-sm border px-1.5",
        "font-mono text-[10px] font-medium tracking-[0.03em]",
        dashed && "border-dashed",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function ConfidenceBadge({ type }: { type: EdgeType }) {
  const spec = EDGE_SPEC[type];
  const tone = (
    { statutory: "statutory", documentary: "active", physical: "neutral", practice: "neutral" } as const
  )[type];
  return (
    <Badge
      tone={tone}
      dashed={spec.dashed}
      className={type === "physical" ? "border-edge-physical bg-edge-physical/[0.06] text-edge-physical" : undefined}
      title={spec.blurb}
    >
      {spec.label.split(" —")[0].toUpperCase()} {spec.confidence.toFixed(2)}
    </Badge>
  );
}
