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

function ApprovalNodeImpl({ data }: NodeProps<ApprovalNodeType>) {
  const { approval, planningDays, onCriticalPath, selected, related, focused, laneIndex } = data;
  const conditional = Boolean(approval.conditional_on);
  const days = planningDays ?? approval.statutory_days;
  const drift = days - approval.statutory_days;

  return (
    <div
      className={cn(
        "anim-node group flex h-[76px] w-[200px] flex-col justify-between rounded border bg-surface px-[9px] py-[7px]",
        "transition-[opacity,box-shadow,border-color,transform] duration-200",
        "hover:-translate-y-[2px] hover:shadow-[0_4px_14px_rgba(26,26,24,0.09)]",
        conditional && "border-dashed",
        onCriticalPath
          ? "border-[1.5px] border-critical shadow-critical"
          : "border-line hover:border-line-strong",
        selected && !onCriticalPath && "border-[1.5px] border-ink",

        selected && "ring-2 ring-offset-1 ring-ink",
        related && "ring-2 ring-ink/15",
        focused && "-translate-y-[2px] shadow-[0_4px_14px_rgba(26,26,24,0.09)]",
      )}
      style={{ animationDelay: `${Math.min(laneIndex, 12) * 45 + 60}ms` }}
    >
      <Handle type="target" position={Position.Top} />
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "font-mono text-[10px] font-semibold tracking-[0.06em]",
            onCriticalPath ? "text-critical" : "text-muted",
          )}
        >
          {approval.id}
        </span>
        <span className="truncate pl-2 font-mono text-[10px] tracking-[0.06em] text-faint">
          {approval.department_short}
        </span>
      </div>

      <div className="line-clamp-2 text-[11.5px] font-medium leading-[1.2] text-ink">
        {approval.name}
      </div>

      <div className="flex items-center justify-between">
        <span className="flex items-baseline gap-1">
          <span className="font-num font-mono text-[11px] font-semibold text-ink">{days} d</span>
          {drift !== 0 ? (
            <span
              className={cn(
                "font-num font-mono text-[9.5px] font-medium",
                drift > 0 ? "text-critical" : "text-state-done-ink",
              )}
              title={`Statutory window is ${approval.statutory_days} days`}
            >
              {drift > 0 ? "+" : ""}
              {drift}
            </span>
          ) : null}
        </span>
        <span className="flex items-center gap-1.5">
          {approval.deemed_exists && !onCriticalPath ? (
            <span className="font-mono text-[10px] font-medium tracking-[0.05em] text-state-deemed-ink">
              DEEMED {approval.deemed_days}d
            </span>
          ) : null}
          {conditional && !onCriticalPath && !approval.deemed_exists ? (
            <span className="font-mono text-[10px] font-medium tracking-[0.05em] text-state-active">
              CONDITIONAL
            </span>
          ) : null}
          {onCriticalPath ? (
            <>
              {approval.deemed_exists ? (
                <span className="h-[5px] w-[5px] rounded-full bg-state-deemed" />
              ) : null}
              <span className="font-mono text-[10px] font-medium tracking-[0.06em] text-critical">
                CRITICAL
              </span>
            </>
          ) : null}
          {/* No fourth signal. A grey dot that means "none of the above" is
              not information, and at 2.6:1 it was not visible either. */}
        </span>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

export const ApprovalNode = memo(ApprovalNodeImpl);
