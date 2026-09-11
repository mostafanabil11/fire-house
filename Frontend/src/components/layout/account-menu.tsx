"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, LogOut, Package, Settings, ShieldCheck, User } from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { logoutUser } from "@/lib/api/auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

// The header's signed-in state. Without this mounted, signing in changed
// nothing visible — the header kept offering "Sign in" and the only route to
// the dashboard was typing /admin by hand.
export function AccountMenu() {
  const { data: user, isLoading } = useCurrentUser();
  const queryClient = useQueryClient();
  const router = useRouter();

  async function handleSignOut() {
    try {
      await logoutUser();
    } catch {
      // Even if the API call fails, clear local state so the UI doesn't
      // strand the customer in a signed-in-looking state.
    }
    queryClient.setQueryData(["auth", "profile"], null);
    queryClient.removeQueries({ queryKey: ["cart", "server"] });
    toast.success("Signed out");
    router.push("/");
  }

  // Reserve the space rather than collapsing it: the header must not jump
  // sideways when the profile request settles a moment after paint.
  if (isLoading) {
    return <span className="hidden w-20 md:block" aria-hidden />;
  }

  if (!user) {
    return (
      <Link href="/login" className="hidden transition-colors hover:text-primary md:block">
        Sign in
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Account menu"
            className="hidden min-h-11 items-center gap-1.5 transition-colors hover:text-primary md:flex"
          />
        }
      >
        <User className="size-4" strokeWidth={2.5} aria-hidden />
        {user.firstName}
        <ChevronDown className="size-3.5" strokeWidth={2.5} aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={12}>
        <div className="px-1.5 py-1 text-xs font-medium text-muted-foreground">{user.email}</div>
        <DropdownMenuSeparator />
        {user.role === "admin" && (
          <>
            {/* First, and named for what it is used for. An owner opening this
                menu during service wants the order board, not a settings page. */}
            <DropdownMenuItem render={<Link href="/admin/orders" />}>
              <ShieldCheck className="size-4" strokeWidth={2} />
              Orders dashboard
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem render={<Link href="/account/orders" />}>
          <Package className="size-4" strokeWidth={2} />
          My orders
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/account/settings" />}>
          <Settings className="size-4" strokeWidth={2} />
          Account settings
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
          <LogOut className="size-4" strokeWidth={2} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
