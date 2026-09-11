"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";
import { InstagramIcon, FacebookIcon } from "@/components/icons/social-icons";
import { MobileAccountLinks } from "@/components/layout/mobile-account-links";
import { RESTAURANT } from "@/config/restaurant";
import { useLanguage } from "@/i18n/language-provider";
import type { Category } from "@/types/category";

interface MobileNavProps {
  sections: Category[];
}

// The phone navigation. The desktop header hides its links below md, so
// without this there is no way to reach the menu, an account, or order
// tracking from a phone at all.
export function MobileNav({ sections }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { isArabic } = useLanguage();

  const close = () => setOpen(false);

  const linkClass =
    "flex min-h-12 items-center text-lg font-black tracking-tight transition-colors hover:text-primary";

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <button
            type="button"
            aria-label="Open navigation"
            className="grid size-11 shrink-0 place-items-center rounded-full border border-border md:hidden"
          />
        }
      >
        <Menu className="size-5" strokeWidth={2.25} />
      </SheetTrigger>

      <SheetContent
        side={isArabic ? "right" : "left"}
        // The sheet's own floating close button would land on top of the brand
        // row; this nav puts its own next to it instead.
        showCloseButton={false}
        className="flex w-[86vw] max-w-none flex-col p-0 sm:w-[380px]"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <Link href="/" onClick={close} className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-primary font-heading text-base font-black text-primary-foreground">
              {RESTAURANT.shortName}
            </span>
            <span className="font-heading text-lg font-black tracking-[-0.02em] uppercase">
              {RESTAURANT.name}
            </span>
          </Link>
          <button
            type="button"
            onClick={close}
            aria-label="Close navigation"
            className="grid size-11 place-items-center rounded-full transition-colors hover:bg-muted"
          >
            <X className="size-5" strokeWidth={2} />
          </button>
        </div>

        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-5 py-5">
          <Link
            href="/menu"
            onClick={close}
            aria-current={pathname === "/menu" ? "page" : undefined}
            className={`${linkClass} text-primary`}
          >
            Full menu
          </Link>

          {sections.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-1 text-xs font-black tracking-[0.14em] text-muted-foreground uppercase">
                Sections
              </p>
              {sections.map((section) => (
                <Link
                  key={section._id}
                  href={`/menu#${section.slug}`}
                  onClick={close}
                  className="flex min-h-11 items-center text-base font-bold text-muted-foreground transition-colors hover:text-foreground"
                >
                  {section.name}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-4 border-t border-border pt-4">
            <Link href="/cart" onClick={close} className={linkClass}>
              Your order
            </Link>
            <Link href="/track-order" onClick={close} className={linkClass}>
              Track an order
            </Link>
            <MobileAccountLinks onNavigate={close} />
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <Link
              href="/contact"
              onClick={close}
              className="flex min-h-11 items-center text-base font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              Contact us
            </Link>
            <Link
              href="/faq"
              onClick={close}
              className="flex min-h-11 items-center text-base font-bold text-muted-foreground transition-colors hover:text-foreground"
            >
              FAQ
            </Link>
          </div>
        </nav>

        <div className="border-t border-border px-5 py-5">
          <div className="flex gap-5">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="grid size-11 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
            >
              <InstagramIcon className="size-5" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="grid size-11 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
            >
              <FacebookIcon className="size-5" />
            </a>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            © {new Date().getFullYear()} {RESTAURANT.name}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
