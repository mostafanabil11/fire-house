"use client";

import { useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { GoogleIcon } from "@/components/icons/social-icons";
import { API_BASE_PATH } from "@/lib/api/client";

// text-base is deliberate: iOS Safari zooms the page in on a focused input
// whose text is under 16px, which throws an auth form sideways on every tap.
const INPUT_CLASS =
  "w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-base text-foreground outline-none transition-colors focus:border-foreground disabled:opacity-60";

export function AuthField({
  label,
  id,
  hint,
  action,
  ...props
}: {
  label: string;
  id: string;
  hint?: string;
  action?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-bold">
          {label}
        </label>
        {action}
      </div>
      <input id={id} className={INPUT_CLASS} {...props} />
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/**
 * A password field with a reveal toggle. Typing a password blind on a phone
 * keyboard is the single most common reason a correct password gets rejected.
 */
export function AuthPasswordField({
  label,
  id,
  hint,
  action,
  ...props
}: {
  label: string;
  id: string;
  hint?: string;
  action?: ReactNode;
} & InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-bold">
          {label}
        </label>
        {action}
      </div>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={`${INPUT_CLASS} pr-12`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute top-1/2 right-1 grid size-11 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
        >
          {visible ? (
            <EyeOff className="size-4.5" strokeWidth={2} />
          ) : (
            <Eye className="size-4.5" strokeWidth={2} />
          )}
        </button>
      </div>
      {hint && <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function AuthSubmitButton({
  pending,
  pendingLabel,
  children,
  disabled,
}: {
  pending: boolean;
  pendingLabel: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="flex min-h-13 w-full items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground transition-transform enabled:hover:-translate-y-0.5 disabled:opacity-45"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="my-6 flex items-center gap-4">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-bold text-muted-foreground uppercase">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

// A plain <a>, not a Link: this leaves the app for the OAuth handshake, so it
// must be a full navigation rather than a client-side route change.
export function GoogleAuthButton({ label }: { label: string }) {
  return (
    <a
      href={`${API_BASE_PATH}/auth/google`}
      className="flex min-h-13 w-full items-center justify-center gap-3 rounded-full border border-border text-sm font-bold transition-colors hover:bg-muted"
    >
      <GoogleIcon className="size-4" />
      {label}
    </a>
  );
}
