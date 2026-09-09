import * as React from "react";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-14 text-center">
      <div className="font-serif text-[19px] font-medium text-ink">{title}</div>
      <p className="max-w-sm text-[12.5px] leading-relaxed text-muted">{body}</p>
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
