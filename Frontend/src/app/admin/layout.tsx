"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";
import { AdminNav, AdminMobileNav } from "@/components/admin/admin-nav";
import { RESTAURANT } from "@/config/restaurant";

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login?next=/admin");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || user.role !== "admin") {
    return null;
  }

  return (
    <>
      {/* pb-20 on small screens clears the fixed bottom bar, so the last order
          on the board is never trapped underneath it. */}
      <div className="mx-auto flex w-full max-w-7xl gap-8 px-4 pt-6 pb-20 sm:px-6 md:pt-8 md:pb-16">
        <aside className="surface sticky top-24 hidden h-fit w-60 shrink-0 p-4 md:block">
          <Link
            href="/"
            className="mb-6 block px-3 font-heading text-xl font-black tracking-tight uppercase"
          >
            {RESTAURANT.name}
          </Link>
          <p className="mb-3 px-4 text-[0.7rem] font-black tracking-[0.14em] text-muted-foreground uppercase">
            Admin
          </p>
          <AdminNav />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>

      <AdminMobileNav />
    </>
  );
}
