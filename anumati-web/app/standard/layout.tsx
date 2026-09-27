import type { Metadata } from "next";

// The page itself is a client component, so its metadata lives here.
export const metadata: Metadata = {
  title: "Open Approval Graph Schema",
  description:
    "OAGS v0.1 — an open JSON schema for approvals, their statutory timelines and the dependencies between them, with a live validator.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
