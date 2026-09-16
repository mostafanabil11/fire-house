import { Clock3 } from "lucide-react";
import { CartIconLink } from "./cart-icon-link";
import { MobileNav } from "./mobile-nav";
import { LanguageToggle } from "./language-toggle";
import { HeaderNav } from "./header-nav";
import { Brand } from "./brand";
import { T } from "@/i18n/language-provider";
import { RESTAURANT } from "@/config/restaurant";

// Navigation stays usable even when the catalog API is waking up.
export function SiteHeader() {
  return <header className="sticky top-0 z-40 border-b border-border/70 bg-background/95 backdrop-blur-xl">
    <div className="h-8 bg-foreground text-background">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-4 text-[10px] font-semibold sm:px-6">
        <span><T>{RESTAURANT.orderStatus}</T></span>
        <span className="hidden items-center gap-2 sm:flex"><Clock3 className="size-3" aria-hidden /><T>Estimated delivery</T> · <T>{RESTAURANT.estimatedDelivery}</T></span>
        <LanguageToggle />
      </div>
    </div>
    <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-2 px-4 sm:gap-4 sm:px-6 lg:h-20">
      <MobileNav sections={[]} />
      <Brand />
      <HeaderNav />
      <CartIconLink showLabel className="ms-auto flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-foreground px-3.5 text-sm font-bold text-background md:ms-0" />
    </div>
  </header>;
}
