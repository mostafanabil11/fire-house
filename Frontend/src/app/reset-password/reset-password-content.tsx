"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { resetPassword } from "@/lib/api/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthPasswordField, AuthSubmitButton } from "@/components/auth/auth-form";

export function ResetPasswordContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () => resetPassword(token!, newPassword),
    onSuccess: () => {
      toast.success("Password reset — sign in with your new one");
      router.push("/login");
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error(message ?? "That reset link is invalid or has expired");
    },
  });

  // Checked as you type rather than only on submit, so the mismatch is
  // obvious before the button is pressed.
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  if (!token) {
    return (
      <AuthShell
        title="This link is incomplete"
        subtitle="The reset link is missing its token, so we can't tell which account it belongs to. Request a fresh one."
      >
        <Link
          href="/forgot-password"
          className="flex min-h-13 w-full items-center justify-center rounded-full bg-primary text-sm font-black text-primary-foreground transition-transform hover:-translate-y-0.5"
        >
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Choose a password you'll remember — you'll use it to sign in from now on."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-bold text-primary hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (newPassword !== confirmPassword) {
            toast.error("Those passwords don't match");
            return;
          }
          mutation.mutate();
        }}
        className="grid gap-4"
      >
        <AuthPasswordField
          label="New password"
          id="newPassword"
          required
          minLength={6}
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          disabled={mutation.isPending}
          hint="At least 6 characters, with an uppercase letter, a lowercase letter, and a number."
        />

        <div>
          <AuthPasswordField
            label="Confirm password"
            id="confirmPassword"
            required
            minLength={6}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={mutation.isPending}
            aria-invalid={mismatch}
          />
          {mismatch && (
            <p className="mt-1.5 text-xs font-bold text-destructive">
              These two don&apos;t match yet.
            </p>
          )}
        </div>

        <AuthSubmitButton
          pending={mutation.isPending}
          pendingLabel="Saving…"
          disabled={mismatch || newPassword.length < 6}
        >
          Save new password
        </AuthSubmitButton>
      </form>
    </AuthShell>
  );
}
