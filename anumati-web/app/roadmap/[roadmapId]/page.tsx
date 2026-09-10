import { AuthGate } from "@/components/auth/AuthGate";
import { RoadmapView } from "./RoadmapView";

export default function RoadmapPage({ params }: { params: { roadmapId: string } }) {
  return (
    <AuthGate allow="applicant">
      <RoadmapView roadmapId={params.roadmapId} />
    </AuthGate>
  );
}
