"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { MailCheck } from "lucide-react";
import { forgotPassword } from "@/lib/api/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthField, AuthSubmitButton } from "@/components/auth/auth-form";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: () => forgotPassword(email),
    // Always shows the same success state, matching the backend's own
    // "if the email exists…" response — confirming or denying an account
    // exists for a given email is an account-enumeration leak either way.
    onSuccess: () => setSubmitted(true),
    onError: () => setSubmitted(true),
  });

  if (submitted) {
    return (
      <AuthShell
        title="Check your email"
        subtitle={`If an account exists for ${email}, we've sent a link to reset your password. It expires in an hour.`}
      >
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
            <MailCheck className="size-5" strokeWidth={2.25} aria-hidden />
          </span>
          <p className="text-sm text-muted-foreground">
            Nothing after a few minutes? Check your spam folder, or try again.
          </p>
        </div>

        <Link
          href="/login"
          className="flex min-h-13 w-full items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground transition-transform hover:-translate-y-0.5"
        >
          Back to sign in
        </Link>

        <button
          type="button"
          onClick={() => setSubmitted(false)}
          className="mt-3 flex min-h-11 w-full items-center justify-center text-sm font-bold text-muted-foreground hover:text-foreground"
        >
          Use a different email
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to set a new one."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link href="/login" className="font-bold text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="grid gap-4"
      >
        <AuthField
          label="Email"
          id="email"
          type="email"
          inputMode="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={mutation.isPending}
        />

        <AuthSubmitButton pending={mutation.isPending} pendingLabel="Sending…">
          Send reset link
        </AuthSubmitButton>
      </form>
    </AuthShell>
  );
}
