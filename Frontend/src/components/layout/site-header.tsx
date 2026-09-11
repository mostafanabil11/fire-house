import Link from "next/link";
import { Clock3, MapPin } from "lucide-react";
import { CartIconLink } from "@/components/layout/cart-icon-link";
import { MobileNav } from "@/components/layout/mobile-nav";
import { AccountMenu } from "@/components/layout/account-menu";
import { LanguageToggle } from "@/components/layout/language-toggle";
import { getCategoryTreeServer } from "@/lib/api/categories";
import { RESTAURANT } from "@/config/restaurant";

export async function SiteHeader() {
  // Menu sections come from the same source the menu page uses, so the nav
  // can never drift from what is actually being served. A failed fetch
  // degrades to a header without section links rather than no header.
  const sections = await getCategoryTreeServer();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-md">
      <div className="border-b border-border/60 bg-foreground text-background">
        <div className="mx-auto flex min-h-10 max-w-7xl items-center justify-between gap-3 px-4 text-[0.75rem] font-semibold sm:px-6">
          <span className="inline-flex items-center gap-2">
            <span className="size-2 rounded-full bg-[var(--success)]" aria-hidden />
            {RESTAURANT.orderStatus}
          </span>
          <span className="hidden flex-1 items-center justify-center gap-4 sm:flex">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="size-3.5" aria-hidden />
              {RESTAURANT.estimatedDelivery}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" aria-hidden />
              Enter your delivery area at checkout
            </span>
          </span>
          <LanguageToggle />
        </div>
      </div>

      <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 sm:gap-5 sm:px-6 lg:min-h-20">
        <MobileNav sections={sections} />

        <Link
          href="/"
          className="flex items-center gap-2.5 sm:gap-3"
          aria-label={`${RESTAURANT.name} home`}
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary font-heading text-lg font-black text-primary-foreground">
            {RESTAURANT.shortName}
          </span>
          <span className="font-heading text-base font-black tracking-[-0.02em] uppercase sm:text-xl">
            {RESTAURANT.name}
          </span>
        </Link>

        <nav
          className="ml-auto hidden items-center gap-7 text-sm font-bold md:flex"
          aria-label="Primary navigation"
        >
          <Link href="/menu" className="transition-colors hover:text-primary">
            Menu
          </Link>
          <Link href="/track-order" className="transition-colors hover:text-primary">
            Track order
          </Link>
          <AccountMenu />
        </nav>

        <CartIconLink
          showLabel
          className="ml-auto flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-foreground px-4 text-sm font-bold text-background transition-transform hover:-translate-y-0.5 md:ml-0"
        />
      </div>
    </header>
  );
}
