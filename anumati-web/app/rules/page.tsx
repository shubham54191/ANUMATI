import { AuthGate } from "@/components/auth/AuthGate";
import { RuleReviewDesk } from "@/components/rules/RuleReviewDesk";
import { LiveOnly } from "@/components/layout/LiveOnly";

export const metadata = { title: "Rule review — ANUMATI" };

export default function RulesPage() {
  return (
    <AuthGate allow="reviewer">
      <LiveOnly what="Rule review">
        <RuleReviewDesk />
      </LiveOnly>
    </AuthGate>
  );
}
