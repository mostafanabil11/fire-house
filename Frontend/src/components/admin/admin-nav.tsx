"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ClipboardList,
  FolderTree,
  LayoutDashboard,
  Package,
  ScrollText,
  Settings,
  MoreHorizontal,
  Star,
  Tag,
  Users,
} from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

// Orders first. It is the only screen the team opens during service; the rest
// is the owner's setup, visited once a week at most.
export const NAV_ITEMS = [
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/notifications", label: "Alerts", icon: Bell },
  { href: "/admin/products", label: "Menu", icon: Package },
  { href: "/admin/categories", label: "Sections", icon: FolderTree },
  { href: "/admin/coupons", label: "Coupons", icon: Tag },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/audit-log", label: "Audit log", icon: ScrollText },
];

export function isNavItemActive(href: string, pathname: string): boolean {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = isNavItemActive(item.href, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm font-bold transition-colors ${
              isActive
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Icon className="size-4" strokeWidth={2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

// The phone version: the four screens that matter during service, fixed to
// the bottom of the viewport where a thumb reaches. Without this the admin
// was desktop-only, on a job that is done standing up.
const PRIMARY_HREFS = ["/admin/orders", "/admin", "/admin/notifications", "/admin/products"];

const MOBILE_ITEMS = NAV_ITEMS.filter((item) => PRIMARY_HREFS.includes(item.href));

// Everything the bottom bar has no room for. Four tabs is the right number to
// reach one-handed, but the six sections left over — sections, coupons,
// reviews, customers, settings, the audit log — had no route in at all on a
// phone: the sidebar holding them is hidden below md. They live behind "More"
// rather than being squeezed into a fifth of a bar.
const MORE_ITEMS = NAV_ITEMS.filter((item) => !PRIMARY_HREFS.includes(item.href));

export function AdminMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const moreIsActive = MORE_ITEMS.some((item) => isNavItemActive(item.href, pathname));

  return (
    <nav
      aria-label="Admin sections"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-border bg-background/95 backdrop-blur-md md:hidden"
    >
      {MOBILE_ITEMS.map((item) => {
        const isActive = isNavItemActive(item.href, pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-bold transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className="size-5" strokeWidth={2} />
            {item.label}
          </Link>
        );
      })}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <button
              type="button"
              className={`flex min-h-16 flex-col items-center justify-center gap-1 text-[0.7rem] font-bold transition-colors ${
                moreIsActive ? "text-primary" : "text-muted-foreground"
              }`}
            />
          }
        >
          <MoreHorizontal className="size-5" strokeWidth={2} />
          More
        </SheetTrigger>
        <SheetContent side="bottom" className="gap-0 p-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <SheetTitle className="border-b px-5 py-4 text-sm font-black tracking-[0.14em] uppercase">
            Admin
          </SheetTitle>
          <SheetDescription className="sr-only">
            The rest of the admin sections.
          </SheetDescription>
          <div className="grid grid-cols-2 gap-2 p-4">
            {MORE_ITEMS.map((item) => {
              const isActive = isNavItemActive(item.href, pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive ? "page" : undefined}
                  className={`flex min-h-14 items-center gap-3 rounded-xl px-4 text-sm font-bold transition-colors ${
                    isActive ? "bg-foreground text-background" : "bg-muted/50 text-foreground"
                  }`}
                >
                  <Icon className="size-4" strokeWidth={2} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
