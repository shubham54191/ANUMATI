import { AuthGate } from "@/components/auth/AuthGate";
import { SimulatorView } from "./SimulatorView";

export default function SimulatePage({ params }: { params: { roadmapId: string } }) {
  return (
    <AuthGate allow="applicant">
      <SimulatorView roadmapId={params.roadmapId} />
    </AuthGate>
  );
}
