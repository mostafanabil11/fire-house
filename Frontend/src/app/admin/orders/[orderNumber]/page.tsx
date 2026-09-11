"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronLeft,
  MapPin,
  MessageCircle,
  Phone,
  StickyNote,
  UtensilsCrossed,
} from "lucide-react";
import { getAdminOrder, updateOrderStatus } from "@/lib/api/orders";
import { formatPrice } from "@/lib/format";
import { paymentSummaryLabel } from "@/lib/payment-label";
import { whatsAppLink, telLink, mapsLink, orderChatMessage } from "@/lib/contact-links";
import { addressText } from "@/lib/address-text";
import { canConfirm, customerName, formatAge } from "@/lib/staff-orders";
import { useConfirmOrder } from "@/hooks/use-confirm-order";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { RESTAURANT } from "@/config/restaurant";

export default function AdminOrderDetailPage() {
  const params = useParams<{ orderNumber: string }>();
  const queryClient = useQueryClient();
  const { confirmOrder, isPending: confirming } = useConfirmOrder();

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin", "orders", params.orderNumber],
    queryFn: () => getAdminOrder(params.orderNumber),
    // Someone else on the team may be working the same order from their own
    // phone; this screen should not show a stale one.
    refetchInterval: 20_000,
  });

  const statusMutation = useMutation({
    mutationFn: (data: Parameters<typeof updateOrderStatus>[1]) =>
      updateOrderStatus(params.orderNumber, data),
    onSuccess: () => {
      toast.success("Order updated");
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error(message ?? "Could not update order");
    },
  });

  if (isLoading || !order) {
    return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
  }

  const name = customerName(order);
  const phone = order.shippingAddress.phone;
  const chat = whatsAppLink(phone, orderChatMessage(RESTAURANT.name, order.orderNumber));
  const call = telLink(phone);
  const map = mapsLink([addressText(order.shippingAddress)]);
  const email = order.user?.email ?? order.guestEmail ?? null;
  const confirmable = canConfirm(order);
  const canRefund = order.paymentStatus === "paid";

  return (
    <div className="pb-28 lg:pb-0">
      <Link
        href="/admin/orders"
        className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" aria-hidden />
        All orders
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-black tracking-tight">{order.orderNumber}</h1>
          <p className="text-sm text-muted-foreground">{formatAge(order.createdAt)}</p>
        </div>
        <OrderStatusBadge
          fulfillmentStatus={order.fulfillmentStatus}
          paymentStatus={order.paymentStatus}
        />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div className="grid gap-4">
          {/* Contact first: staff reach for the phone before anything else. */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-heading text-lg font-black">{name}</h2>
            {email && <p className="mt-0.5 text-sm text-muted-foreground">{email}</p>}

            <div className="mt-4 flex flex-wrap gap-2">
              {chat ? (
                <a
                  href={chat}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 text-sm font-black text-white sm:flex-none"
                >
                  <MessageCircle className="size-4" strokeWidth={2.5} aria-hidden />
                  WhatsApp
                </a>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {phone} — not a number we can message
                </span>
              )}
              {call && (
                <a
                  href={call}
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-bold sm:flex-none"
                >
                  <Phone className="size-4" strokeWidth={2.5} aria-hidden />
                  {phone}
                </a>
              )}
            </div>

            <div className="mt-4 flex items-start gap-2.5 border-t border-border pt-4">
              <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{addressText(order.shippingAddress)}</p>
                <a
                  href={map}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex min-h-10 items-center text-sm font-bold text-primary hover:underline"
                >
                  Open in Maps
                </a>
              </div>
            </div>
          </section>

          {/* What the kitchen has to make, including every change the customer
              asked for — the difference between a correct order and a remake. */}
          <section className="rounded-2xl border border-border bg-card p-5">
            <h2 className="font-heading text-lg font-black">
              {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
            </h2>
            <ul className="mt-4 grid gap-4">
              {order.items.map((item, index) => {
                const details = [
                  ...(item.variant ? [item.variant.name] : []),
                  ...item.modifiers.map((modifier) => modifier.name),
                ];
                return (
                  <li key={`${item.product}-${index}`} className="flex gap-3">
                    <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <span className="grid size-full place-items-center text-muted-foreground">
                          <UtensilsCrossed className="size-5" strokeWidth={1.5} aria-hidden />
                        </span>
                      )}
                      <span className="absolute -top-1 -right-1 grid size-6 place-items-center rounded-full bg-foreground text-xs font-black text-background">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold">{item.name}</p>
                      {details.length > 0 && (
                        <p className="text-sm text-muted-foreground">{details.join(" · ")}</p>
                      )}
                      {item.note && (
                        <p className="mt-1 flex items-start gap-1.5 rounded-lg bg-accent/60 px-2 py-1 text-sm font-semibold text-accent-foreground">
                          <StickyNote className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} aria-hidden />
                          {item.note}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-sm font-bold">{formatPrice(item.lineTotal)}</p>
                  </li>
                );
              })}
            </ul>

            <dl className="mt-5 grid gap-1.5 border-t border-border pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatPrice(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd>{order.shippingCost === 0 ? "Free" : formatPrice(order.shippingCost)}</dd>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">
                    Discount{order.couponCode ? ` (${order.couponCode})` : ""}
                  </dt>
                  <dd>−{formatPrice(order.discountAmount)}</dd>
                </div>
              )}
              <div className="mt-1 flex justify-between border-t border-border pt-2 text-base font-black">
                <dt>Total</dt>
                <dd>{formatPrice(order.total)}</dd>
              </div>
            </dl>

            <p className="mt-4 text-sm">
              <span className="font-bold">Payment:</span> {paymentSummaryLabel(order)}
            </p>
            {order.paymentReference && (
              <p className="text-sm">
                <span className="font-bold">InstaPay reference:</span> {order.paymentReference}
              </p>
            )}
            {order.trackingNumber && (
              <p className="text-sm">
                <span className="font-bold">Tracking:</span> {order.trackingNumber}
              </p>
            )}
          </section>
        </div>

        {/* One obvious next step, with the destructive option kept away from
            it. On a phone this sits in a bar fixed to the bottom. */}
        <section className="rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-6">
          <h2 className="font-heading text-lg font-black">What next</h2>

          {confirmable ? (
            <button
              type="button"
              onClick={() => confirmOrder(order)}
              disabled={confirming}
              className="mt-4 min-h-13 w-full rounded-full bg-primary text-sm font-black text-primary-foreground disabled:opacity-50"
            >
              {confirming ? "Confirming…" : "Confirm order"}
            </button>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              {order.fulfillmentStatus === "cancelled"
                ? "This order was cancelled."
                : ["unfulfilled", "processing"].includes(order.fulfillmentStatus)
                  ? "Waiting on the customer's card payment."
                  : "This order is confirmed."}
            </p>
          )}

          {canRefund && (
            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    "Mark this order as refunded? This only records the status — send the money back through Paymob or InstaPay separately.",
                  )
                ) {
                  statusMutation.mutate({ paymentStatus: "refunded" });
                }
              }}
              disabled={statusMutation.isPending}
              className="mt-6 min-h-11 w-full rounded-full border border-destructive text-xs font-bold text-destructive disabled:opacity-50"
            >
              Mark as refunded
            </button>
          )}
        </section>
      </div>
    </div>
  );
}
