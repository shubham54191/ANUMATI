"use client";
import * as React from "react";
import type { Meta } from "@/types/api";
import { TopBar } from "./TopBar";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export function AppShell({
  active,
  meta,
  variant,
  subtitle,
  children,
}: {
  active?: string;
  meta?: Meta;
  variant?: "default" | "board";
  subtitle?: string;
  children: React.ReactNode;
}) {
  useKeyboardShortcuts();
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-bg">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:h-10 focus:px-4 focus:py-2 focus:rounded focus:bg-accent focus:text-accent-ink focus:font-medium"
      >
        Skip to main content
      </a>
      <TopBar active={active} meta={meta} variant={variant} subtitle={subtitle} />
      <div id="main" className="flex min-h-0 flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
