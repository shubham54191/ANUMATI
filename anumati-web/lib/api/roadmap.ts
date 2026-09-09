import type { Meta } from "@/types/api";
import type { Roadmap, RoadmapRequest } from "@/types/roadmap";
import { buildRoadmap } from "@/lib/data/engine";
import { APPROVALS } from "@/lib/data/maharashtraFood";

const API = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function getRoadmap(
  request: RoadmapRequest,
): Promise<{ data: Roadmap; meta: Meta }> {
  if (API) {
    const res = await fetch(`${API}/roadmap`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
    });
    if (!res.ok) throw new Error(`roadmap: ${res.status}`);
    return res.json();
  }
  return { data: buildRoadmap(request), meta: localMeta() };
}

export function getRoadmapSync(request: RoadmapRequest): { data: Roadmap; meta: Meta } {
  return { data: buildRoadmap(request), meta: localMeta() };
}

export function localMeta(): Meta {
  return {
    rules_version: "v1.3",
    rules_as_of: "2026-09-07",
    engine_version: "8f31c04",
    generated_at: new Date().toISOString(),
    approvals_count: APPROVALS.length,
    flagged_count: APPROVALS.filter((a) => a.flagged).length,
  };
}
