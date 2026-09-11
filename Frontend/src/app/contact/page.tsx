import type { Metadata } from "next";
import Link from "next/link";
import { ReceiptText } from "lucide-react";
import { RESTAURANT } from "@/config/restaurant";

export const metadata: Metadata = {
  title: `Contact — ${RESTAURANT.name}`,
  description: `Get help with an order from ${RESTAURANT.name}.`,
};

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-(--spacing-container-max) px-margin-mobile py-stack-xl md:px-margin-desktop">
      <div className="mx-auto max-w-xl text-center">
        <h1 className="mb-3 font-heading text-headline-sm font-bold text-foreground md:text-headline-md">
          Get in Touch
        </h1>
        <p className="mb-10 text-[14px] leading-relaxed text-muted-foreground">
          Questions about an order, delivery, or the menu? Our restaurant team is here to help.
        </p>

        <Link
          href="/track-order"
          className="inline-flex items-center gap-3 border border-foreground px-8 py-4 text-[14px] font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
        >
          <ReceiptText className="size-4" strokeWidth={1.5} />
          Track an order
        </Link>

        <p className="mt-10 text-[13px] text-muted-foreground">
          If your question is about an existing order, include your order number — you can find it in{" "}
          <Link href="/account/orders" className="text-foreground underline">
            Order History
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
