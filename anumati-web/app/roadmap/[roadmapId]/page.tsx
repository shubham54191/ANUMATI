import { RoadmapView } from "./RoadmapView";

export default function RoadmapPage({ params }: { params: { roadmapId: string } }) {
  return <RoadmapView roadmapId={params.roadmapId} />;
}
