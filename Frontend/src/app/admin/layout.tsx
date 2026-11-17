"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useHydrated } from "@/hooks/use-hydrated";
import { AdminMobileNav, AdminSidebar, AdminTopBar } from "@/components/admin/admin-nav";
import { NewOrderWatcher } from "@/components/admin/new-order-watcher";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  const router = useRouter();
  const hydrated = useHydrated();
  const { data: user, isLoading } = useCurrentUser();
  const isAdmin = !!user && user.role === "admin";

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login?next=/admin/orders");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  // The server and the first client render both draw this frame, so nothing
  // jumps and React has nothing to disagree about. The real shell replaces it
  // once the browser has taken over and the account is known to be staff.
  if (!hydrated || !isAdmin) {
    return (
      <div className="min-h-dvh lg:flex" aria-busy="true">
        <div className="hidden w-60 shrink-0 border-e border-border bg-card lg:block" />
        <div className="h-14 border-b border-border lg:hidden" />
        <div className="flex-1 px-4 py-5 sm:px-6 lg:py-8">
          <div className="h-9 w-40 animate-pulse rounded-xl bg-muted" />
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="h-64 animate-pulse rounded-2xl bg-muted" />
            <div className="h-64 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <NewOrderWatcher>
      <div className="min-h-dvh lg:flex">
        <AdminSidebar />
        <div className="min-w-0 flex-1">
          <AdminTopBar />
          {/* Bottom padding clears the fixed tab bar on phones and tablets,
              so the last order on the board is never trapped under it. */}
          <div className="mx-auto w-full max-w-[1400px] px-4 pt-5 pb-28 sm:px-6 lg:py-8">
            {children}
          </div>
        </div>
      </div>
      <AdminMobileNav />
    </NewOrderWatcher>
  );
}
