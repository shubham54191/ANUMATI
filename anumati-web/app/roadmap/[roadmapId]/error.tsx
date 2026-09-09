"use client";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  const cyclic = error.message.includes("cycle");
  return (
    <div className="flex h-screen items-center justify-center bg-bg">
      <EmptyState
        title={cyclic ? "The rule graph contains a cycle" : "This roadmap could not be built"}
        body={
          cyclic
            ? "Two approvals each require the other. The engine refuses to guess an order — a reviewer has to break the cycle in the rule base."
            : error.message
        }
        action={<Button onClick={reset}>Try again</Button>}
      />
    </div>
  );
}
