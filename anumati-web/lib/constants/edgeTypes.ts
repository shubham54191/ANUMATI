import type { EdgeType } from "@/types/dependency";

interface EdgeSpec {
  label: string;

  confidence: number;
  colorVar: string;
  strokeWidth: number;
  dashed: boolean;

  removable: boolean;
  blurb: string;
}

export const EDGE_SPEC: Record<EdgeType, EdgeSpec> = {
  statutory: {
    label: "Statutory",
    confidence: 1.0,
    colorVar: "--edge-statutory",
    strokeWidth: 2.2,
    dashed: false,
    removable: false,
    blurb: "Written into the act or rule.",
  },
  documentary: {
    label: "Documentary",
    confidence: 0.9,
    colorVar: "--edge-documentary",
    strokeWidth: 1.6,
    dashed: false,
    removable: true,
    blurb: "One approval's form requires another's certificate.",
  },
  physical: {
    label: "Physical",
    confidence: 1.0,
    colorVar: "--edge-physical",
    strokeWidth: 1.6,
    dashed: false,
    removable: false,
    blurb: "Impossible in the other order.",
  },
  practice: {
    label: "Practice — not law",
    confidence: 0.5,
    colorVar: "--edge-practice",
    strokeWidth: 1.4,
    dashed: true,
    removable: true,
    blurb: "Convention at the counter. Reformable without touching statute.",
  },
};
