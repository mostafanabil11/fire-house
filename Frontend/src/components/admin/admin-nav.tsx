"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  ClipboardList,
  ExternalLink,
  FolderTree,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  ScrollText,
  Settings,
  Star,
  Tag,
  UtensilsCrossed,
  Users,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { useStaffAlerts } from "@/components/admin/new-order-watcher";
import { useCurrentUser } from "@/hooks/use-current-user";
import { logoutUser } from "@/lib/api/auth";
import { RESTAURANT } from "@/config/restaurant";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Orders stands alone: it is the only screen the team opens during service.
// The rest is the owner's setup, visited once a week at most.
const ORDERS: NavItem = { href: "/admin/orders", label: "Orders", icon: ClipboardList };

const GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Restaurant",
    items: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard },
      { href: "/admin/products", label: "Menu", icon: UtensilsCrossed },
      { href: "/admin/categories", label: "Sections", icon: FolderTree },
      { href: "/admin/coupons", label: "Coupons", icon: Tag },
      { href: "/admin/reviews", label: "Reviews", icon: Star },
      { href: "/admin/customers", label: "Customers", icon: Users },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/notifications", label: "Alerts", icon: Bell },
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/audit-log", label: "Audit log", icon: ScrollText },
    ],
  },
];

const ALL_ITEMS = [ORDERS, ...GROUPS.flatMap((group) => group.items)];

export function isNavItemActive(href: string, pathname: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function CountBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        "grid h-5 min-w-5 place-items-center rounded-full bg-danger-strong px-1.5 text-xs leading-none font-extrabold text-white tabular-nums",
        className,
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function useSignOut() {
  const queryClient = useQueryClient();
  const router = useRouter();
  return async function signOut() {
    try {
      await logoutUser();
    } catch {
      // Clear local state either way, so nobody is left looking signed in.
    }
    queryClient.setQueryData(["auth", "profile"], null);
    queryClient.removeQueries({ queryKey: ["admin"] });
    toast.success("Signed out");
    router.push("/login");
  };
}

export function AdminBrand({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/admin/orders" className="flex min-w-0 items-center gap-2.5">
      <Image
        src="/images/brand/fire-house-mark.webp"
        alt=""
        width={36}
        height={36}
        className="size-9 shrink-0 object-contain"
      />
      <span className="min-w-0 leading-tight">
        <span className="block truncate font-heading text-base">{RESTAURANT.name}</span>
        {!compact && <span className="block text-xs font-semibold text-muted-foreground">Staff</span>}
      </span>
    </Link>
  );
}

const staffToggleClass =
  "min-h-11 border-border px-3.5 text-sm font-bold hover:bg-muted focus-visible:outline-primary";

/** The desktop sidebar, from `lg` up. */
export function AdminSidebar() {
  const pathname = usePathname();
  const { waitingCount } = useStaffAlerts();
  const { data: user } = useCurrentUser();
  const signOut = useSignOut();
  const ordersActive = isNavItemActive(ORDERS.href, pathname);

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col overflow-y-auto border-e border-border bg-card px-3 py-5 lg:flex">
      <div className="px-2">
        <AdminBrand />
      </div>

      <nav aria-label="Admin sections" className="mt-6 flex flex-1 flex-col">
        <Link
          href={ORDERS.href}
          aria-current={ordersActive ? "page" : undefined}
          className={cn(
            "flex min-h-12 items-center gap-3 rounded-xl px-3 text-base font-extrabold transition-colors",
            ordersActive ? "bg-foreground text-background" : "hover:bg-muted",
          )}
        >
          <ORDERS.icon className="size-5" strokeWidth={2.25} aria-hidden />
          <span className="flex-1">{ORDERS.label}</span>
          <CountBadge count={waitingCount} />
        </Link>

        {GROUPS.map((group) => (
          <div key={group.label} className="mt-6">
            <p className="px-3 pb-1.5 text-xs font-bold text-muted-foreground">{group.label}</p>
            <ul className="grid gap-0.5">
              {group.items.map((item) => {
                const active = isNavItemActive(item.href, pathname);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition-colors",
                        active
                          ? "bg-muted font-bold text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <item.icon className="size-4" strokeWidth={2} aria-hidden />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="mt-auto grid gap-1 border-t border-border pt-4">
          <LanguageToggle className={cn(staffToggleClass, "justify-start rounded-xl border-0")} />
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center gap-2 rounded-xl px-3.5 text-sm font-bold hover:bg-muted"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            View website
          </a>
          <div className="mt-1 flex items-center gap-2 px-3.5">
            {user && (
              <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground" data-i18n-ignore>
                {user.firstName}
              </span>
            )}
            <button
              type="button"
              onClick={signOut}
              className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground"
            >
              <LogOut className="size-4 rtl:rotate-180" aria-hidden />
              Sign out
            </button>
          </div>
        </div>
      </nav>
    </aside>
  );
}

/** The top bar below `lg`: whose dashboard this is, and the language. */
export function AdminTopBar() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/95 px-4 backdrop-blur-md sm:px-6 lg:hidden">
      <AdminBrand />
      <LanguageToggle className={cn(staffToggleClass, "min-h-10 border")} />
    </header>
  );
}

// The phone version: the four screens that matter during service, fixed to
// the bottom of the viewport where a thumb reaches. Everything else lives
// behind "More".
const PRIMARY_HREFS = ["/admin/orders", "/admin", "/admin/products", "/admin/notifications"];
const MOBILE_ITEMS = PRIMARY_HREFS.map((href) => ALL_ITEMS.find((item) => item.href === href)!);
const MORE_ITEMS = ALL_ITEMS.filter((item) => !PRIMARY_HREFS.includes(item.href));

export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { waitingCount } = useStaffAlerts();
  const signOut = useSignOut();
  const moreIsActive = MORE_ITEMS.some((item) => isNavItemActive(item.href, pathname));
  const tabClass =
    "relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-bold transition-colors";

  return (
    <nav
      aria-label="Admin sections"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
    >
      {MOBILE_ITEMS.map((item) => {
        const active = isNavItemActive(item.href, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(tabClass, active ? "text-primary" : "text-muted-foreground")}
          >
            <span className="relative">
              <item.icon className="size-5" strokeWidth={2} aria-hidden />
              {item.href === ORDERS.href && (
                <CountBadge count={waitingCount} className="absolute -top-2 -end-3" />
              )}
            </span>
            {item.label}
          </Link>
        );
      })}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <button
              type="button"
              className={cn(tabClass, moreIsActive ? "text-primary" : "text-muted-foreground")}
            />
          }
        >
          <MoreHorizontal className="size-5" strokeWidth={2} aria-hidden />
          More
        </SheetTrigger>
        <SheetContent side="bottom" className="gap-0 rounded-t-3xl p-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <SheetTitle className="border-b px-5 py-4 font-heading text-lg">More</SheetTitle>
          <SheetDescription className="sr-only">The rest of the admin sections.</SheetDescription>
          <div className="grid grid-cols-2 gap-2 p-4">
            {MORE_ITEMS.map((item) => {
              const active = isNavItemActive(item.href, pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 items-center gap-3 rounded-xl px-4 text-sm font-bold transition-colors",
                    active ? "bg-foreground text-background" : "bg-muted/60 text-foreground",
                  )}
                >
                  <item.icon className="size-4" strokeWidth={2} aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <div className="grid gap-2 border-t border-border p-4">
            <LanguageToggle className={cn(staffToggleClass, "justify-center rounded-xl border")} />
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="action-secondary min-h-11 rounded-xl"
            >
              <ExternalLink className="size-4" aria-hidden />
              View website
            </a>
            <button type="button" onClick={signOut} className="action-secondary min-h-11 rounded-xl">
              <LogOut className="size-4 rtl:rotate-180" aria-hidden />
              Sign out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
