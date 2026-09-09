import { SimulatorView } from "./SimulatorView";

export default function SimulatePage({ params }: { params: { roadmapId: string } }) {
  return <SimulatorView roadmapId={params.roadmapId} />;
}
