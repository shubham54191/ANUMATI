"use client";
import { memo } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import type { Approval } from "@/types/approval";
import { cn } from "@/lib/utils";

export interface ApprovalNodeData extends Record<string, unknown> {
  approval: Approval;
  /** Days the graph laid this node out with — statutory or observed. */
  planningDays: number;
  onCriticalPath: boolean;
  selected: boolean;
  related: boolean;
  focused: boolean;
  laneIndex: number;
}

export type ApprovalNodeType = Node<ApprovalNodeData, "approvalNode">;

/**
 * 200 × 76, board skin. Three rows, fixed: identity, name, duration and one
 * signal. Nothing else earns a place at this size — a fourth row belongs in
 * the detail panel.
 */
function ApprovalNodeImpl({ data }: NodeProps<ApprovalNodeType>) {
  const { approval, planningDays, onCriticalPath, selected, related, focused, laneIndex } = data;
  const conditional = Boolean(approval.conditional_on);
  const days = planningDays ?? approval.statutory_days;
  const drift = days - approval.statutory_days;

  const pill = onCriticalPath
    ? { text: "CRITICAL", className: "bg-db-red-tint text-db-red" }
    : approval.deemed_exists
      ? { text: `DEEMED ${approval.deemed_days}d`, className: "bg-db-emerald-tint text-db-emerald" }
      : conditional
        ? { text: "CONDITIONAL", className: "bg-db-blue-tint text-db-blue" }
        : null;

  return (
    <div
      className={cn(
        "anim-node group flex h-[76px] w-[200px] flex-col justify-between rounded-lg border bg-surface px-3 py-2",
        "transition-[opacity,box-shadow,border-color,transform] duration-200",
        "hover:-translate-y-[2px] hover:shadow-[0_6px_18px_rgba(15,23,42,0.08)]",
        conditional && !onCriticalPath && "border-dashed",
        onCriticalPath ? "border-[1.5px] border-db-red" : "border-db-line hover:border-db-blue/40",
        selected && "ring-2 ring-offset-1 ring-db-blue",
        related && "ring-2 ring-db-blue/15",
        focused && "-translate-y-[2px] shadow-[0_6px_18px_rgba(15,23,42,0.08)]",
      )}
      style={{ animationDelay: `${Math.min(laneIndex, 12) * 45 + 60}ms` }}
    >
      <Handle type="target" position={Position.Top} />

      <span
        className={cn(
          "font-mono text-[10px] font-semibold tracking-[0.05em]",
          onCriticalPath ? "text-db-red" : "text-db-faint",
        )}
      >
        {approval.id}
      </span>

      <span className="line-clamp-2 text-[11px] font-medium leading-[1.2] text-db-ink">
        {approval.name}
      </span>

      <span className="flex items-center justify-between">
        <span className="flex items-baseline gap-1">
          <span className="font-num text-[11.5px] font-semibold text-db-ink">{days} d</span>
          {drift !== 0 ? (
            <span
              className={cn(
                "font-num font-mono text-[9.5px] font-medium",
                drift > 0 ? "text-db-red" : "text-db-emerald",
              )}
              title={`Statutory window is ${approval.statutory_days} days`}
            >
              {drift > 0 ? "+" : ""}
              {drift}
            </span>
          ) : null}
        </span>
        {pill ? (
          <span
            className={cn(
              "rounded-full px-1.5 py-[1px] font-mono text-[9px] font-semibold tracking-[0.05em]",
              pill.className,
            )}
          >
            {pill.text}
          </span>
        ) : (
          <span className="font-mono text-[9px] tracking-[0.05em] text-db-faint">
            {approval.department_short}
          </span>
        )}
      </span>

      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export const ApprovalNode = memo(ApprovalNodeImpl);
