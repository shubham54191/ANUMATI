import type { DataRecordState, DeptReview, ReviewState } from "@/types/matrix";

/** One place where a review state becomes a colour and a word. */
export const REVIEW_META: Record<
  ReviewState,
  { label: string; colorVar: string; text: string; bg: string; border: string }
> = {
  queued: {
    label: "QUEUED",
    colorVar: "--state-pending",
    text: "text-muted",
    bg: "bg-sunk",
    border: "border-line",
  },
  in_review: {
    label: "PROCESSING",
    colorVar: "--state-active",
    text: "text-state-active",
    bg: "bg-state-active/[0.05]",
    border: "border-state-active/40",
  },
  approved: {
    label: "APPROVED",
    colorVar: "--state-done",
    text: "text-state-done-ink",
    bg: "bg-state-done/[0.06]",
    border: "border-state-done/45",
  },
  rejected: {
    label: "REJECTED",
    colorVar: "--state-blocked",
    text: "text-critical",
    bg: "bg-critical/[0.06]",
    border: "border-critical/45",
  },
  transferred_to_committee: {
    label: "WITH COMMITTEE",
    colorVar: "--state-active",
    text: "text-accent",
    bg: "bg-accent-muted",
    border: "border-accent/45",
  },
  deemed_approved: {
    label: "DEEMED APPROVED",
    colorVar: "--state-deemed",
    text: "text-state-deemed-ink",
    bg: "bg-state-deemed/[0.07]",
    border: "border-state-deemed/45",
  },
};

export const RECORD_META: Record<DataRecordState, { label: string; text: string; dot: string }> = {
  idle: { label: "NOT FETCHED", text: "text-faint", dot: "bg-line-strong" },
  fetching: { label: "FETCHING", text: "text-state-active", dot: "bg-state-active" },
  verified: { label: "VERIFIED", text: "text-state-done-ink", dot: "bg-state-done" },
  mismatch: { label: "MISMATCH", text: "text-critical", dot: "bg-critical" },
  unavailable: { label: "UNAVAILABLE", text: "text-state-deemed-ink", dot: "bg-state-deemed" },
};

/** How much of a department's window has been used, capped for the bar. */
export function slaFraction(review: DeptReview, day: number): number {
  if (review.sla_days <= 0) return 1;
  const used = (review.decided_on_day ?? day) / review.sla_days;
  return Math.max(0, Math.min(1, used));
}

export function slaLabel(review: DeptReview, day: number): string {
  const settledOn = review.decided_on_day;
  if (settledOn !== null) {
    return review.state === "deemed_approved"
      ? `deemed d${settledOn} · ${review.sla_days} d limit`
      : `decided d${settledOn} of ${review.sla_days} d`;
  }
  if (review.state === "transferred_to_committee") {
    return `transferred d${review.escalated_on_day} · limit was ${review.sla_days} d`;
  }
  const left = review.sla_days - day;
  if (left < 0) return `overdue by ${Math.abs(left)} d`;
  if (left === 0) return "due today";
  return `${left} d left of ${review.sla_days}`;
}

export const dayStamp = (day: number) => `d${day}`;
