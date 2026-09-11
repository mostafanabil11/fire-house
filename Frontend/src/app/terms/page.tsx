import type { Metadata } from "next";
import Link from "next/link";
import { RESTAURANT } from "@/config/restaurant";

export const metadata: Metadata = {
  title: `Terms of Service — ${RESTAURANT.name}`,
  description: `The terms that govern your use of ${RESTAURANT.name} and orders placed with the restaurant.`,
};

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-(--spacing-container-max) px-margin-mobile py-stack-xl md:px-margin-desktop">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 font-heading text-headline-sm font-bold text-foreground md:text-headline-md">
          Terms of Service
        </h1>
        <p className="mb-12 text-[13px] text-muted-foreground">Last updated August 2026</p>

        <div className="space-y-10 text-[14px] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 font-heading text-headline-sm font-bold text-foreground">Orders</h2>
            <p>
              Placing an order is an offer to purchase, which we accept once your order is confirmed — by
              email for cash-on-delivery orders, or once payment is confirmed for card orders. Prices are
              listed in Egyptian Pounds (EGP) and include any applicable tax shown at checkout.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-headline-sm font-bold text-foreground">Availability &amp; Pricing</h2>
            <p>
              We make every effort to keep menu availability and prices accurate, but a dish can occasionally
              become unavailable between browsing and checkout. If that happens, we&apos;ll never charge you for an item we
              can&apos;t prepare — your order is blocked from completing until your cart reflects what&apos;s
              actually available.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-headline-sm font-bold text-foreground">Payment</h2>
            <p>
              We accept Cash on Delivery and card payments processed securely by Paymob. For card orders, your
              payment is authorized before your order is confirmed; if payment isn&apos;t completed within the
              checkout window, the order is automatically cancelled and nothing is charged.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-headline-sm font-bold text-foreground">Cancellations</h2>
            <p>
              You can cancel an order yourself from your order history as long as it hasn&apos;t been paid for
              or entered preparation. For help with an active order, see our{" "}
              <Link href="/shipping-returns" className="text-foreground underline">
                delivery information
              </Link>{" "}
              page for how to arrange a return.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-headline-sm font-bold text-foreground">Coupons &amp; Promotions</h2>
            <p>
              Coupon codes are subject to their own terms (minimum order value, eligible products, expiry date)
              shown when you apply them, and each code may only be redeemed once per customer unless stated
              otherwise.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-headline-sm font-bold text-foreground">Account Responsibility</h2>
            <p>
              You&apos;re responsible for keeping your account password confidential and for all activity under
              your account. Contact us immediately if you suspect unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-headline-sm font-bold text-foreground">Contact</h2>
            <p>
              Questions about these terms can be sent through our{" "}
              <Link href="/contact" className="text-foreground underline">contact page</Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
