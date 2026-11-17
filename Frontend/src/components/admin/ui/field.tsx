import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// 16px text on purpose: anything smaller makes iOS zoom the page on focus.
export const inputClass =
  "w-full min-h-12 rounded-xl border border-border bg-background px-4 py-2.5 text-base text-foreground outline-none transition-colors focus:border-foreground disabled:opacity-60";

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: ReactNode;
  hint?: ReactNode;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-bold text-foreground">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function CheckboxField({
  checked,
  onChange,
  label,
  hint,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: ReactNode;
  hint?: ReactNode;
  className?: string;
}) {
  return (
    <label
      className={cn(
        "flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-border bg-background px-4 py-3",
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-5 shrink-0 accent-primary"
      />
      <span>
        <span className="block text-sm font-bold">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted-foreground">{hint}</span>}
      </span>
    </label>
  );
}
