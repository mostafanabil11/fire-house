"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { loginUser } from "@/lib/api/auth";
import { mergeLocalCartIntoServerCart } from "@/lib/cart-merge";
import { AuthShell } from "@/components/auth/auth-shell";
import {
  AuthField,
  AuthPasswordField,
  AuthSubmitButton,
  AuthDivider,
  GoogleAuthButton,
} from "@/components/auth/auth-form";

// Only same-origin paths are honoured. Taking ?next= at face value would let a
// crafted link bounce someone to another site immediately after they sign in,
// with the trust of having just landed there from a real login form.
function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }
  return next;
}

export function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const next = searchParams.get("next");
  const cameFromCheckout = next?.startsWith("/checkout");

  const { mutate, isPending } = useMutation({
    mutationFn: loginUser,
    onSuccess: async (user) => {
      queryClient.setQueryData(["auth", "profile"], user);
      await mergeLocalCartIntoServerCart();
      queryClient.invalidateQueries({ queryKey: ["cart", "server"] });
      toast.success(`Welcome back, ${user.firstName}`);
      // Back to wherever the customer was — signing in from checkout must
      // return to checkout, not abandon the order they were about to place.
      router.push(safeNextPath(next));
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error(message ?? "Invalid email or password");
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutate({ email, password });
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle={
        cameFromCheckout
          ? "Sign in to use your saved addresses — your order is waiting."
          : "Sign in to reorder your favourites and track your delivery."
      }
      footer={
        <p className="text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link
            href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
            className="font-bold text-primary hover:underline"
          >
            Create an account
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} className="grid gap-4">
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
          disabled={isPending}
        />

        <AuthPasswordField
          label="Password"
          id="password"
          required
          minLength={6}
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isPending}
          action={
            <Link
              href="/forgot-password"
              className="text-sm font-bold text-primary hover:underline"
            >
              Forgot?
            </Link>
          }
        />

        <AuthSubmitButton pending={isPending} pendingLabel="Signing in…">
          Sign in
        </AuthSubmitButton>
      </form>

      <AuthDivider />

      <GoogleAuthButton label="Continue with Google" />

      {/* Ordering never required an account, and saying so here stops the
          login page reading as a wall in front of the food. */}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        You can also{" "}
        <Link href="/menu" className="font-bold text-foreground hover:underline">
          order as a guest
        </Link>{" "}
        — no account needed.
      </p>
    </AuthShell>
  );
}
