import type { DataRecordState, DeptReview, ReviewState } from "@/types/matrix";

/**
 * One place where a review state becomes a colour and a word.
 *
 * `colorVar` still drives the SVG connectors in the review flow, so it stays a
 * raw custom property. Everything else is board-skin classes: tinted pill,
 * hairline border, and a matching icon tile.
 */
export const REVIEW_META: Record<
  ReviewState,
  {
    label: string;
    colorVar: string;
    text: string;
    bg: string;
    border: string;
    tile: string;
    dot: string;
  }
> = {
  queued: {
    label: "OPEN",
    colorVar: "--db-faint",
    text: "text-db-muted",
    bg: "bg-db-bg",
    border: "border-db-line",
    tile: "bg-db-bg text-db-muted",
    dot: "bg-db-faint",
  },
  in_review: {
    label: "PROCESSING",
    colorVar: "--db-blue",
    text: "text-db-blue",
    bg: "bg-db-blue-tint",
    border: "border-db-blue/35",
    tile: "bg-db-blue-tint text-db-blue",
    dot: "bg-db-blue",
  },
  approved: {
    label: "APPROVED",
    colorVar: "--db-green",
    text: "text-db-green",
    bg: "bg-db-green-tint",
    border: "border-db-green/40",
    tile: "bg-db-green-tint text-db-green",
    dot: "bg-db-green",
  },
  rejected: {
    label: "REJECTED",
    colorVar: "--db-red",
    text: "text-db-red",
    bg: "bg-db-red-tint",
    border: "border-db-red/40",
    tile: "bg-db-red-tint text-db-red",
    dot: "bg-db-red",
  },
  deemed_approved: {
    label: "DEEMED APPROVED",
    colorVar: "--db-amber",
    text: "text-db-amber",
    bg: "bg-db-amber-tint",
    border: "border-db-amber/40",
    tile: "bg-db-amber-tint text-db-amber",
    dot: "bg-db-amber",
  },
};

export const RECORD_META: Record<
  DataRecordState,
  { label: string; text: string; dot: string; tile: string; card: string }
> = {
  idle: {
    label: "NOT FETCHED",
    text: "text-db-faint",
    dot: "bg-db-faint",
    tile: "bg-db-bg text-db-faint",
    card: "border-db-line bg-surface",
  },
  fetching: {
    label: "FETCHING",
    text: "text-db-blue",
    dot: "bg-db-blue",
    tile: "bg-db-blue-tint text-db-blue",
    card: "border-db-blue/30 bg-surface",
  },
  verified: {
    label: "VERIFIED",
    text: "text-db-green",
    dot: "bg-db-green",
    tile: "bg-db-green-tint text-db-green",
    card: "border-db-line bg-surface",
  },
  mismatch: {
    label: "FLAGGED",
    text: "text-db-red",
    dot: "bg-db-red",
    tile: "bg-db-red-tint text-db-red",
    card: "border-db-red/35 bg-surface",
  },
  unavailable: {
    label: "UNAVAILABLE",
    text: "text-db-amber",
    dot: "bg-db-amber",
    tile: "bg-db-amber-tint text-db-amber",
    card: "border-db-amber/35 bg-surface",
  },
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
      ? `deemed day ${settledOn} · ${review.sla_days} d`
      : `decided day ${settledOn}`;
  }
  const left = review.sla_days - day;
  if (left < 0) return `overdue by ${Math.abs(left)} d`;
  if (left === 0) return "due today";
  return `${left} d left`;
}

export const dayStamp = (day: number) => `d${day}`;
