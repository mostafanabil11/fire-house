"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { Search, Loader2, RefreshCw, ReceiptText } from "lucide-react";
import { isAxiosError } from "axios";
import { T } from "@/i18n/language-provider";
import { OrderProgress } from "@/components/orders/order-progress";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { lookupOrder, getOrderToken } from "@/lib/api/orders";
import { OrderDetail } from "@/components/orders/order-detail";
import type { Order } from "@/types/order";

const inputClass =
  "form-field";
const labelClass = "mb-2 block text-sm font-bold";

// Lets anyone who ordered — guest or member — reach an order with the pair of
// things only they should have: the order number and the email it was placed
// with. This is the fallback for a guest whose one-time checkout token is
// gone (new tab, new device, next week).
export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () => lookupOrder(orderNumber.trim(), email.trim()),
    onSuccess: (found) => {
      setOrder(found);
      setError(null);
    },
    onError: (err: unknown) => {
      setOrder(null);
      // The server deliberately can't distinguish "no such order" from "not
      // yours", so neither can this message.
      setError(
        isAxiosError(err) && err.response?.status === 429
          ? "Too many attempts — please wait a minute and try again."
          : "We couldn't find an order with that number and email address.",
      );
    },
  });

  return (
    <div className="page-shell">
      <div className="surface mx-auto max-w-xl">
        <span className="mb-5 grid size-12 place-items-center rounded-2xl bg-secondary text-primary"><ReceiptText className="size-5" aria-hidden /></span>
        <h1 className="mb-2 font-heading text-headline-md font-bold text-foreground">Track Your Order</h1>
        <p className="mb-8 text-body-md text-muted-foreground">
          Enter your order number and the email address you used at checkout.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (orderNumber.trim() && email.trim()) mutation.mutate();
          }}
          className="space-y-4"
        >
          <div>
            <label className={labelClass} htmlFor="track-orderNumber">
              Order Number
            </label>
            <input
              id="track-orderNumber"
              required
              placeholder="Your order number"
              autoComplete="off"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              disabled={mutation.isPending}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="track-email">
              Email
            </label>
            <input
              id="track-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={mutation.isPending}
              className={inputClass}
            />
          </div>

          <button
            type="submit"
            disabled={!orderNumber.trim() || !email.trim() || mutation.isPending}
            className="action-primary w-full"
          >
            {mutation.isPending ? (
              <Loader2 className="size-4 animate-spin" strokeWidth={2} />
            ) : (
              <Search className="size-4" strokeWidth={1.75} />
            )}
            Find Order
          </button>
        </form>

        {error && (
          <p role="alert" className="mt-4 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      {order && (
        <div className="mt-12">
          <section className="surface mx-auto mb-7 max-w-3xl" aria-label="Order progress">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div><p className="eyebrow"><T>Your order</T></p><h2 className="mt-1 font-heading text-xl"><bdi>{order.orderNumber}</bdi></h2></div><OrderStatusBadge fulfillmentStatus={order.fulfillmentStatus} paymentStatus={order.paymentStatus} /></div>
            <OrderProgress status={order.fulfillmentStatus} />
            <button type="button" onClick={() => mutation.mutate()} disabled={mutation.isPending} className="action-secondary mt-6"><RefreshCw className={`size-4 ${mutation.isPending ? 'animate-spin' : ''}`} aria-hidden /><T>Refresh status</T></button>
          </section>
          {/* Cancelling needs the checkout token (or an account), not just the
              number-and-email pair that got us this far — see OrderDetail. */}
          <OrderDetail order={order} canCancel={!!getOrderToken(order.orderNumber)} />
          <div className="mx-auto mt-8 max-w-xl">
            <Link
              href="/"
              className="block w-full bg-primary py-4 text-center text-button font-medium tracking-[0.05em] text-primary-foreground uppercase transition-colors hover:bg-primary/90"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
