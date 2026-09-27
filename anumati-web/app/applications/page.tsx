import { AuthGate } from "@/components/auth/AuthGate";
import { ApplicationList } from "@/components/applications/ApplicationList";
import { LiveOnly } from "@/components/layout/LiveOnly";

export const metadata = { title: "My applications — ANUMATI" };

export default function ApplicationsPage() {
  return (
    <AuthGate allow="applicant">
      <LiveOnly what="Filing an application">
        <ApplicationList />
      </LiveOnly>
    </AuthGate>
  );
}
