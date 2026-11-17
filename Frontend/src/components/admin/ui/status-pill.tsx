import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type StatusTone = "neutral" | "success" | "warning" | "danger" | "danger-solid";

const TONE_CLASS: Record<StatusTone, string> = {
  neutral: "bg-muted text-foreground",
  success: "bg-success-soft text-success-strong",
  warning: "bg-warning-soft text-warning-strong",
  danger: "bg-danger-soft text-danger-strong",
  "danger-solid": "bg-danger-strong text-white",
};

export function StatusPill({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: StatusTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs leading-none font-bold whitespace-nowrap [&_svg]:size-3.5 [&_svg]:shrink-0",
        TONE_CLASS[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
