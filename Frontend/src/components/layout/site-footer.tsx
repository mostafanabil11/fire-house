import Link from "next/link";
import { RESTAURANT } from "@/config/restaurant";

const ORDER_LINKS = [
  { href: "/menu", label: "Menu" },
  { href: "/cart", label: "Your order" },
  { href: "/track-order", label: "Track order" },
];

const HELP_LINKS = [
  { href: "/contact", label: "Contact" },
  { href: "/faq", label: "FAQ" },
  { href: "/shipping-returns", label: "Delivery" },
];

const LEGAL_LINKS = [
  { href: "/terms", label: "Terms" },
  { href: "/privacy", label: "Privacy" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="font-heading text-2xl font-black tracking-tight uppercase">
              {RESTAURANT.name}
            </p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-background/65">
              Order directly from the restaurant. Your order is confirmed and prepared by our own
              team — no middleman, no extra fees.
            </p>
          </div>

          <FooterColumn title="Order" links={ORDER_LINKS} />
          <FooterColumn title="Help" links={HELP_LINKS} />
          <FooterColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        <p className="mt-10 border-t border-background/15 pt-6 text-xs text-background/55">
          © {new Date().getFullYear()} {RESTAURANT.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-xs font-black tracking-[0.14em] text-background/50 uppercase">{title}</p>
      <ul className="mt-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex min-h-10 items-center text-sm font-semibold text-background/85 transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
