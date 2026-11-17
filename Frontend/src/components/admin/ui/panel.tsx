import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  title,
  action,
  children,
  className,
  flush = false,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  // Lists draw their own row padding and dividers edge to edge.
  flush?: boolean;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-border bg-card",
        flush ? "overflow-hidden" : "p-4 sm:p-5",
        className,
      )}
    >
      {(title || action) && (
        <div
          className={cn(
            "flex items-center justify-between gap-3",
            flush ? "border-b border-border px-4 py-3 sm:px-5" : "mb-4",
          )}
        >
          {title && <h2 className="font-heading text-lg">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
