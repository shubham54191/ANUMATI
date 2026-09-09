import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded border border-line bg-surface", className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center gap-3 px-4 py-3", className)} {...props} />;
}

export function Label({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("label", className)} {...props} />;
}
