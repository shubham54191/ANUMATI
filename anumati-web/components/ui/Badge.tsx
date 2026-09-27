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
    neutral: "border-db-line bg-bg text-db-faint",
    critical: "border-db-red bg-db-red/[0.06] text-db-red",
    deemed: "border-db-amber bg-db-amber/[0.07] text-state-deemed",
    done: "border-db-green bg-db-green/[0.06] text-state-done",
    active: "border-edge-documentary bg-edge-documentary/[0.06] text-edge-documentary",
    statutory: "border-edge-statutory bg-edge-statutory/[0.06] text-edge-statutory",
  };
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-lg border px-1.5",
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
