"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { logoutUser } from "@/lib/api/auth";

// The signed-in half of the phone menu. Split out of MobileNav so the sheet
// itself stays a plain list of links and only this part re-renders when the
// profile request settles.
export function MobileAccountLinks({ onNavigate }: { onNavigate: () => void }) {
  const { data: user, isLoading } = useCurrentUser();
  const queryClient = useQueryClient();
  const router = useRouter();

  const linkClass =
    "flex min-h-12 items-center text-lg font-black tracking-tight transition-colors hover:text-primary";

  if (isLoading) return null;

  if (!user) {
    return (
      <Link href="/login" onClick={onNavigate} className={linkClass}>
        Sign in
      </Link>
    );
  }

  async function handleSignOut() {
    try {
      await logoutUser();
    } catch {
      // Clear local state regardless, so the menu can't keep claiming the
      // customer is signed in.
    }
    queryClient.setQueryData(["auth", "profile"], null);
    queryClient.removeQueries({ queryKey: ["cart", "server"] });
    onNavigate();
    toast.success("Signed out");
    router.push("/");
  }

  return (
    <>
      {user.role === "admin" && (
        <Link
          href="/admin/orders"
          onClick={onNavigate}
          className="mb-1 flex min-h-12 items-center gap-2 text-lg font-black tracking-tight text-primary"
        >
          <ShieldCheck className="size-5" strokeWidth={2.5} aria-hidden />
          Orders dashboard
        </Link>
      )}
      <Link href="/account/orders" onClick={onNavigate} className={linkClass}>
        My orders
      </Link>
      <Link href="/account/settings" onClick={onNavigate} className={linkClass}>
        Account settings
      </Link>
      <button type="button" onClick={handleSignOut} className={`${linkClass} text-muted-foreground`}>
        Sign out
      </button>
    </>
  );
}
