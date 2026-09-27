import type { Metadata } from "next";

// A roadmap is per-project and behind sign-in, so the title is generic and the
// page is left out of the sitemap.
export const metadata: Metadata = {
  title: "Project roadmap",
  description: "Every clearance this project needs, in dependency order, with the critical path and the section of the act behind each rule.",
  robots: { index: false, follow: false },
};

import { AuthGate } from "@/components/auth/AuthGate";
import { RoadmapView } from "./RoadmapView";

export default function RoadmapPage({ params }: { params: { roadmapId: string } }) {
  return (
    <AuthGate allow="applicant">
      <RoadmapView roadmapId={params.roadmapId} />
    </AuthGate>
  );
}
