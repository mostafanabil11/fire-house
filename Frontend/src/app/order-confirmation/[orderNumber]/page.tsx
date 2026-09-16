"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Check,
  Clock3,
  Copy,
  Mail,
  MapPin,
  MessageCircle,
  ReceiptText,
  Truck,
  UtensilsCrossed,
} from "lucide-react";
import { getOrder } from "@/lib/api/orders";
import { formatPrice } from "@/lib/format";
import { paymentSummaryLabel } from "@/lib/payment-label";
import { addressText } from "@/lib/address-text";
import { deliveryWindow } from "@/lib/order-progress";
import { RESTAURANT } from "@/config/restaurant";
import { OrderProgress } from "@/components/orders/order-progress";
import { OrderItems } from "@/components/orders/order-items";
import { CancelOrderButton, isCancellable } from "@/components/orders/cancel-order-button";

const CARD = "rounded-[1.5rem] border border-border bg-card";

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="mb-4 flex items-center gap-2.5 font-heading text-lg font-black tracking-tight">
      <span className="text-primary">{icon}</span>
      {children}
    </h2>
  );
}

// The order number is the one thing the customer may need to type somewhere
// else later, so it is offered as a copy rather than as text to transcribe.
function OrderNumberChip({ orderNumber }: { orderNumber: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(orderNumber);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard access can be refused (insecure origin, permissions).
          // The number is on screen either way, so there is nothing to fix.
        }
      }}
      className="group inline-flex min-h-11 items-center gap-2.5 rounded-full border-2 border-foreground bg-background px-5 font-mono text-sm font-black tracking-tight text-foreground transition-colors hover:bg-muted"
      aria-label={`Copy order number ${orderNumber}`}
    >
      {orderNumber}
      {copied ? (
        <Check className="size-4 text-primary" strokeWidth={3} />
      ) : (
        <Copy className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" strokeWidth={2.25} />
      )}
    </button>
  );
}

export default function OrderConfirmationPage() {
  const params = useParams<{ orderNumber: string }>();

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["orders", params.orderNumber],
    queryFn: () => getOrder(params.orderNumber),
  });

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="h-56 animate-pulse rounded-[1.5rem] bg-muted" />
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="h-80 animate-pulse rounded-[1.5rem] bg-muted" />
          <div className="h-64 animate-pulse rounded-[1.5rem] bg-muted" />
        </div>
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="mx-auto flex w-full max-w-xl flex-col items-center px-4 py-20 text-center sm:px-6">
        <h1 className="mb-3 font-heading text-3xl font-black tracking-[-0.04em]">Order not found</h1>
        {/* The most likely cause for a guest is a reopened link in a new tab:
            the one-time token lives in sessionStorage and doesn't survive
            that. The email lookup is the way back in. */}
        <p className="mb-7 text-body-md text-muted-foreground">
          If you checked out as a guest, look your order up with your order number and the email address you
          used.
        </p>
        <Link
          href="/track-order"
          className="inline-flex min-h-13 items-center rounded-full bg-primary px-8 text-sm font-black text-primary-foreground transition-transform hover:-translate-y-0.5"
        >
          Track your order
        </Link>
        <Link href="/" className="mt-6 text-[13px] text-muted-foreground underline underline-offset-2">
          Back to home
        </Link>
      </div>
    );
  }

  const arrival = deliveryWindow(order);
  const isCancelled = order.fulfillmentStatus === "cancelled";
  const customerEmail = order.guestEmail ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      {/* --- Confirmation --- */}
      <section className={`${CARD} overflow-hidden`}>
        <div className="border-b border-border bg-primary/[0.06] px-5 py-8 text-center sm:px-8 sm:py-10">
          <span
            className={`mx-auto mb-5 grid size-16 place-items-center rounded-full ${
              isCancelled ? "bg-destructive/10 text-destructive" : "bg-primary text-primary-foreground"
            }`}
          >
            {isCancelled ? (
              <ReceiptText className="size-8" strokeWidth={2.25} />
            ) : (
              <Check className="size-9" strokeWidth={3} />
            )}
          </span>

          <h1 className="font-heading text-3xl font-black tracking-[-0.04em] sm:text-4xl">
            {isCancelled ? "Order cancelled" : `Thanks, ${order.shippingAddress.firstName}!`}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-body-md text-muted-foreground">
            {isCancelled
              ? "This order has been cancelled and nothing will be charged."
              : "Your order is in — our kitchen is on it."}
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <OrderNumberChip orderNumber={order.orderNumber} />
            <Link
              href="/track-order"
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-foreground px-5 text-sm font-black text-background transition-transform hover:-translate-y-0.5"
            >
              Track order
              <ArrowRight className="size-4" strokeWidth={2.5} />
            </Link>
          </div>
        </div>

        {/* The three things someone checks first: when, how much, how paid. */}
        <dl className="grid divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <div className="px-5 py-5 text-center sm:px-6">
            <dt className="flex items-center justify-center gap-1.5 text-[11px] font-black tracking-[0.1em] text-muted-foreground uppercase">
              <Clock3 className="size-3.5" strokeWidth={2.5} />
              {isCancelled ? "Placed" : "Arriving"}
            </dt>
            <dd className="mt-2 text-[15px] font-black tracking-tight text-foreground">
              {isCancelled || !arrival
                ? new Date(order.createdAt).toLocaleDateString([], { day: "numeric", month: "short" })
                : `${arrival.from} – ${arrival.to}`}
            </dd>
            {/* One text node, not "about " + the estimate: the translator
                matches whole text nodes, and a split pair never matches. */}
            {!isCancelled && arrival && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {`about ${RESTAURANT.estimatedDelivery}`}
              </p>
            )}
          </div>

          <div className="px-5 py-5 text-center sm:px-6">
            <dt className="flex items-center justify-center gap-1.5 text-[11px] font-black tracking-[0.1em] text-muted-foreground uppercase">
              <ReceiptText className="size-3.5" strokeWidth={2.5} />
              Total
            </dt>
            <dd className="mt-2 text-[15px] font-black tracking-tight text-foreground">
              {formatPrice(order.total)}
            </dd>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
            </p>
          </div>

          <div className="px-5 py-5 text-center sm:px-6">
            <dt className="flex items-center justify-center gap-1.5 text-[11px] font-black tracking-[0.1em] text-muted-foreground uppercase">
              <Truck className="size-3.5" strokeWidth={2.5} />
              Payment
            </dt>
            <dd className="mt-2 text-[15px] font-black tracking-tight text-foreground">
              {paymentSummaryLabel(order)}
            </dd>
            {order.paymentReference && (
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">{order.paymentReference}</p>
            )}
          </div>
        </dl>
      </section>

      {/* --- Where the order has got to --- */}
      {!isCancelled && (
        <section className={`${CARD} mt-4 p-5 sm:p-6`}>
          <OrderProgress status={order.fulfillmentStatus} />
        </section>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr] lg:items-start">
        <div className="grid gap-4">
          {/* --- The food --- */}
          <section className={`${CARD} p-5 sm:p-6`}>
            <SectionHeading icon={<UtensilsCrossed className="size-5" strokeWidth={2.25} />}>
              Your order
            </SectionHeading>
            <OrderItems items={order.items} />
          </section>

          {/* --- What happens next --- */}
          {!isCancelled && (
            <section className={`${CARD} p-5 sm:p-6`}>
              <SectionHeading icon={<MessageCircle className="size-5" strokeWidth={2.25} />}>
                What happens next
              </SectionHeading>
              <ol className="grid gap-4">
                {[
                  {
                    icon: Mail,
                    title: "Check your inbox",
                    body: customerEmail
                      ? `We've sent your receipt to ${customerEmail}.`
                      : "We've emailed your receipt and order number.",
                  },
                  {
                    icon: UtensilsCrossed,
                    title: "We cook it fresh",
                    body: "Nothing is made in advance — your food starts once the kitchen accepts the order.",
                  },
                  {
                    icon: Truck,
                    title: "The driver may call",
                    body: `Keep ${order.shippingAddress.phone} nearby in case they need directions.`,
                  },
                ].map(({ icon: Icon, title, body }) => (
                  <li key={title} className="flex gap-3.5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-foreground">
                      <Icon className="size-4.5" strokeWidth={2.25} />
                    </span>
                    <div>
                      <p className="text-sm font-black tracking-tight text-foreground">{title}</p>
                      <p className="mt-0.5 text-[13px] text-muted-foreground">{body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        {/* --- Receipt and delivery, alongside the order on a wide screen --- */}
        <div className="grid gap-4 lg:sticky lg:top-28">
          <section className={`${CARD} p-5 sm:p-6`}>
            <SectionHeading icon={<ReceiptText className="size-5" strokeWidth={2.25} />}>
              Summary
            </SectionHeading>
            <dl className="grid gap-2.5 text-[13px]">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="font-bold text-foreground">{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Delivery fee</dt>
                <dd className="font-bold text-foreground">
                  {order.shippingCost === 0 ? "Free" : formatPrice(order.shippingCost)}
                </dd>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">
                    {order.couponCode ? `Discount (${order.couponCode})` : "Discount"}
                  </dt>
                  <dd className="font-bold text-primary">−{formatPrice(order.discountAmount)}</dd>
                </div>
              )}
              <div className="mt-1 flex items-center justify-between border-t border-border pt-3">
                <dt className="font-heading text-base font-black tracking-tight text-foreground">Total</dt>
                <dd className="font-heading text-xl font-black tracking-tight text-foreground">
                  {formatPrice(order.total)}
                </dd>
              </div>
            </dl>
          </section>

          <section className={`${CARD} p-5 sm:p-6`}>
            <SectionHeading icon={<MapPin className="size-5" strokeWidth={2.25} />}>
              Delivering to
            </SectionHeading>
            <p className="text-sm font-black tracking-tight text-foreground">
              {order.shippingAddress.firstName} {order.shippingAddress.lastName}
            </p>
            <p className="mt-1 text-[13px] text-muted-foreground">{addressText(order.shippingAddress)}</p>
            <p className="mt-1 text-[13px] text-muted-foreground">{order.shippingAddress.phone}</p>

            {order.trackingNumber && (
              <p className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-muted px-4 py-3 text-[13px]">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Truck className="size-4" strokeWidth={2.25} />
                  Delivery reference
                </span>
                <span className="font-black text-foreground">{order.trackingNumber}</span>
              </p>
            )}
          </section>

          <div className="grid gap-3">
            <Link
              href="/menu"
              className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-black text-primary-foreground transition-transform hover:-translate-y-0.5"
            >
              Order something else
              <ArrowRight className="size-4" strokeWidth={2.5} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex min-h-13 items-center justify-center rounded-full border-2 border-border px-6 text-sm font-black text-foreground transition-colors hover:bg-muted"
            >
              Something wrong? Contact us
            </Link>
            {isCancellable(order) && (
              <div className="mt-1 text-center">
                <CancelOrderButton order={order} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
