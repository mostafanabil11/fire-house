import type { Metadata } from "next";
import Link from "next/link";
import { RESTAURANT } from "@/config/restaurant";

export const metadata: Metadata = {
  title: `Delivery Information — ${RESTAURANT.name}`,
  description: "How restaurant delivery, order changes, and cancellations work.",
};

export default function DeliveryInformationPage() {
  return (
    <div className="mx-auto w-full max-w-(--spacing-container-max) px-margin-mobile py-stack-xl md:px-margin-desktop">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-12 font-heading text-headline-sm font-bold text-foreground md:text-headline-md">
          Delivery Information
        </h1>

        <div className="space-y-10 text-[14px] leading-relaxed text-muted-foreground">
          <section>
            <h2 className="mb-3 font-heading text-headline-sm font-bold text-foreground">Delivery area and fee</h2>
            <p>
              Enter your delivery area during checkout. The website confirms availability and shows the full
              delivery fee before you place the order.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-headline-sm font-bold text-foreground">Estimated time</h2>
            <p>
              The current estimate is shown before checkout. Times can change during busy periods, but you can
              always check the latest status from the order-tracking page.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-headline-sm font-bold text-foreground">Changing or cancelling</h2>
            <p>
              An order can be cancelled before the kitchen starts preparing it. If preparation has already
              started, contact the restaurant as soon as possible and quote your order number.
            </p>
          </section>

          <section>
            <h2 className="mb-3 font-heading text-headline-sm font-bold text-foreground">Track your order</h2>
            <p>
              Use your order number and email address on the{" "}
              <Link href="/track-order" className="text-foreground underline">
                order-tracking page
              </Link>{" "}
              to see its current status.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
