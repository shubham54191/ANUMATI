import { AuthGate } from "@/components/auth/AuthGate";
import { CommitteeDesk } from "@/components/committee/CommitteeDesk";
import { LiveOnly } from "@/components/layout/LiveOnly";

export const metadata = { title: "Empowered Committee — ANUMATI" };

export default function CommitteePage() {
  return (
    <AuthGate allow="committee">
      <LiveOnly what="The Committee desk">
        <CommitteeDesk />
      </LiveOnly>
    </AuthGate>
  );
}
