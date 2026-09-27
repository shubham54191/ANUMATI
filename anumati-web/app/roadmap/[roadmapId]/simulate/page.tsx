import type { Metadata } from "next";

// A roadmap is per-project and behind sign-in, so the title is generic and the
// page is left out of the sitemap.
export const metadata: Metadata = {
  title: "Reform simulator",
  description: "What a reform would actually save: shorten a notified limit, drop a dependency that rests on practice rather than law, and see the effect on the critical path.",
  robots: { index: false, follow: false },
};

import { AuthGate } from "@/components/auth/AuthGate";
import { SimulatorView } from "./SimulatorView";

export default function SimulatePage({ params }: { params: { roadmapId: string } }) {
  return (
    <AuthGate allow="applicant">
      <SimulatorView roadmapId={params.roadmapId} />
    </AuthGate>
  );
}
