import { AuthGate } from "@/components/auth/AuthGate";
import { ApplicationView } from "@/components/applications/ApplicationView";
import { LiveOnly } from "@/components/layout/LiveOnly";

export const metadata = { title: "Application — ANUMATI" };

export default function ApplicationPage({ params }: { params: { id: string } }) {
  return (
    <AuthGate allow="applicant">
      <LiveOnly what="A filed application">
        <ApplicationView id={decodeURIComponent(params.id)} />
      </LiveOnly>
    </AuthGate>
  );
}
