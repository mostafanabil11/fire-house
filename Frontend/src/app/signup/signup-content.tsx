"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { MailCheck } from "lucide-react";
import { registerUser, verifyEmail, resendOtp } from "@/lib/api/auth";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  AuthField,
  AuthPasswordField,
  AuthSubmitButton,
  AuthDivider,
  GoogleAuthButton,
} from "@/components/auth/auth-form";

function safeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return null;
  }
  return next;
}

export function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNextPath(searchParams.get("next"));

  const [step, setStep] = useState<"register" | "verify">("register");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");

  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: () => {
      setStep("verify");
      toast.success("Check your email for a verification code");
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error(message ?? "Could not create your account");
    },
  });

  const verifyMutation = useMutation({
    mutationFn: verifyEmail,
    onSuccess: () => {
      toast.success("Email verified — sign in to finish");
      // Carries the original destination through, so verifying an account
      // part-way through checkout still lands back at checkout.
      router.push(next ? `/login?next=${encodeURIComponent(next)}` : "/login");
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error(message ?? "That code is invalid or has expired");
    },
  });

  const resendMutation = useMutation({
    mutationFn: resendOtp,
    onSuccess: () => toast.success("A new code is on its way"),
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error(message ?? "Could not resend the code");
    },
  });

  if (step === "verify") {
    return (
      <AuthShell
        title="Check your email"
        subtitle={`We sent a 6-digit code to ${email}. Enter it below to finish setting up your account.`}
      >
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
            <MailCheck className="size-5" strokeWidth={2.25} aria-hidden />
          </span>
          <p className="text-sm text-muted-foreground">
            It can take a minute to arrive. Check your spam folder if it doesn&apos;t.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            verifyMutation.mutate({ email, otp });
          }}
          className="grid gap-4"
        >
          <div>
            <label htmlFor="otp" className="mb-1.5 block text-sm font-bold">
              Verification code
            </label>
            <input
              id="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="······"
              className="w-full rounded-2xl border border-border bg-background px-4 py-3.5 text-center font-heading text-2xl font-black tracking-[0.4em] outline-none transition-colors focus:border-foreground"
            />
          </div>

          <AuthSubmitButton
            pending={verifyMutation.isPending}
            pendingLabel="Verifying…"
            disabled={otp.length !== 6}
          >
            Verify email
          </AuthSubmitButton>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-1 gap-y-2 text-sm text-muted-foreground">
          <span>Didn&apos;t get it?</span>
          <button
            type="button"
            onClick={() => resendMutation.mutate(email)}
            disabled={resendMutation.isPending}
            className="font-bold text-primary hover:underline disabled:opacity-50"
          >
            {resendMutation.isPending ? "Sending…" : "Send a new code"}
          </button>
          <span aria-hidden>·</span>
          <button
            type="button"
            onClick={() => setStep("register")}
            className="font-bold text-foreground hover:underline"
          >
            Change email
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Save your address, keep your order history, and reorder in two taps."
      footer={
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
            className="font-bold text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          registerMutation.mutate({ email, password, firstName, lastName });
        }}
        className="grid gap-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <AuthField
            label="First name"
            id="firstName"
            required
            autoComplete="given-name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            disabled={registerMutation.isPending}
          />
          <AuthField
            label="Last name"
            id="lastName"
            required
            autoComplete="family-name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            disabled={registerMutation.isPending}
          />
        </div>

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
          disabled={registerMutation.isPending}
          hint="We send your order confirmations here."
        />

        <AuthPasswordField
          label="Password"
          id="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={registerMutation.isPending}
          hint="At least 6 characters."
        />

        <AuthSubmitButton pending={registerMutation.isPending} pendingLabel="Creating account…">
          Create account
        </AuthSubmitButton>
      </form>

      <AuthDivider />

      <GoogleAuthButton label="Continue with Google" />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Just want food?{" "}
        <Link href="/menu" className="font-bold text-foreground hover:underline">
          Order as a guest
        </Link>
        .
      </p>
    </AuthShell>
  );
}
