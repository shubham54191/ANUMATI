import type { Approval } from "./approval";
import type { Dependency } from "./dependency";

export interface Batch {

  day: number;
  approvals: string[];
}

export interface RoadmapRequest {
  sector: string;
  location: string;
  size_band: string;
  stage: string;
  conditions: Record<string, boolean | number>;
}

export interface Roadmap {
  id: string;
  request: RoadmapRequest;
  approvals: Approval[];
  dependencies: Dependency[];
  batches: Batch[];

  critical_path: string[];
  sequential_days: number;
  optimised_days: number;

  earliest_finish: Record<string, number>;
}
