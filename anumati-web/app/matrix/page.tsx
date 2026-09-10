import { AuthGate } from "@/components/auth/AuthGate";
import { MatrixConsole } from "./MatrixConsole";

export const metadata = {
  title: "Clearance console — ANUMATI Matrix 2.0",
};

export default function MatrixPage() {
  return (
    <AuthGate allow="officer">
      <MatrixConsole />
    </AuthGate>
  );
}
