"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  MapPin,
  Phone,
  StickyNote,
  User,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/social-icons";
import { formatPrice } from "@/lib/format";
import { paymentMethodLabel } from "@/lib/payment-label";
import { whatsAppLink, telLink, orderChatMessage } from "@/lib/contact-links";
import { addressText } from "@/lib/address-text";
import { canConfirm, customerName, formatAge, isOverdue } from "@/lib/staff-orders";
import { useConfirmOrder } from "@/hooks/use-confirm-order";
import { RESTAURANT } from "@/config/restaurant";
import type { AdminOrderListItem } from "@/lib/api/orders";

type Tone = "new" | "late" | "pending" | "done" | "off";

// Colour is intentionally limited to the small status pill. Keeping the card
// edge neutral makes a busy order board calmer and easier to scan.
const TONES: Record<Tone, { pill: string }> = {
  new: {
    pill: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200 dark:bg-red-500/15 dark:text-red-300 dark:ring-red-500/25",
  },
  late: { pill: "bg-destructive text-white" },
  pending: {
    pill: "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-300",
  },
  done: {
    pill: "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  off: { pill: "bg-muted text-muted-foreground" },
};

function orderState(order: AdminOrderListItem): { tone: Tone; label: string } {
  if (order.fulfillmentStatus === "cancelled") return { tone: "off", label: "Cancelled" };
  if (["confirmed", "shipped", "delivered"].includes(order.fulfillmentStatus)) {
    return { tone: "done", label: "Confirmed" };
  }
  // Still waiting, but not on us: a card payment that never completed.
  if (!canConfirm(order)) return { tone: "pending", label: "Awaiting card payment" };
  if (isOverdue(order)) return { tone: "late", label: "Waiting too long" };
  return { tone: "new", label: "Needs confirmation" };
}

// Cash gets no badge until it is collected: unpaid is the normal state of a
// cash order, and flagging it would teach staff to ignore the flag.
function paymentBadge(order: AdminOrderListItem): { label: string; className: string } | null {
  switch (order.paymentStatus) {
    case "paid":
      return { label: "Paid", className: TONES.done.pill };
    case "refunded":
      return { label: "Refunded", className: TONES.off.pill };
    case "failed":
      return { label: "Payment failed", className: "bg-destructive/10 text-destructive" };
    default:
      return order.paymentMethod === "cod" ? null : { label: "Unpaid", className: TONES.pending.pill };
  }
}

function clockTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function OrderCard({
  order,
  queuePosition,
}: {
  order: AdminOrderListItem;
  queuePosition?: number;
}) {
  const name = customerName(order);
  const phone = order.shippingAddress?.phone ?? null;
  const chat = whatsAppLink(phone, orderChatMessage(RESTAURANT.name, order.orderNumber));
  const call = telLink(phone);
  const address = order.shippingAddress ? addressText(order.shippingAddress) : "";
  const confirmable = canConfirm(order);
  const { confirmOrder, isPending } = useConfirmOrder();
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const state = orderState(order);
  const tone = TONES[state.tone];
  const payment = paymentBadge(order);
  const href = `/admin/orders/${order.orderNumber}`;
  const statusRail =
    state.tone === "done"
      ? "bg-emerald-500"
      : state.tone === "off"
        ? "bg-muted-foreground/35"
        : "bg-destructive";

  return (
    <article className="relative overflow-hidden rounded-[1.35rem] border border-foreground/10 bg-card shadow-[0_4px_18px_rgb(0_0_0/0.055)] transition-shadow hover:border-foreground/15 hover:shadow-[0_7px_24px_rgb(0_0_0/0.09)]">
      <span
        aria-hidden
        className={`absolute inset-y-3 left-0 w-1.5 rounded-r-full ${statusRail}`}
      />
      <div className="grid gap-4 py-4 pe-4 ps-5 lg:grid-cols-[14.5rem_minmax(0,1fr)] xl:grid-cols-[14.5rem_minmax(0,1fr)_10.5rem] xl:items-start">
        <section aria-label="Customer and order details" className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[0.64rem] font-black tracking-[0.12em] text-muted-foreground uppercase">
              Customer
            </p>
            {queuePosition !== undefined && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[0.62rem] font-black text-muted-foreground">
                #{queuePosition} in queue
              </span>
            )}
          </div>

          <div className="mt-2 flex items-center gap-2.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground text-background">
              <User className="size-4" strokeWidth={2.5} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base leading-tight font-black">{name}</p>
              {call ? (
                <a
                  href={call}
                  className="mt-1 inline-flex max-w-full items-center gap-1.5 text-sm font-bold tracking-wide tabular-nums transition-colors hover:text-primary"
                >
                  <Phone className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2.25} aria-hidden />
                  <span dir="ltr" data-i18n-ignore className="truncate">{phone}</span>
                </a>
              ) : (
                <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                  <Phone className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
                  <span>{phone || "No phone number"}</span>
                </p>
              )}
            </div>
            {chat && (
              <a
                href={chat}
                target="_blank"
                rel="noopener noreferrer"
                title="Chat on WhatsApp"
                aria-label={`Chat with ${name} on WhatsApp`}
                className="grid size-9 shrink-0 place-items-center rounded-full bg-[#25D366] text-white shadow-sm transition hover:brightness-105"
              >
                <WhatsAppIcon className="size-4.5" aria-hidden />
              </a>
            )}
          </div>

          <div className="mt-3 border-t border-border/70 pt-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <Link href={href} className="text-xs font-black hover:underline">
                {order.orderNumber}
              </Link>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.58rem] font-black tracking-wide uppercase ${tone.pill}`}>
                {state.tone === "late" && <AlertTriangle className="size-3" strokeWidth={2.5} aria-hidden />}
                {state.label}
              </span>
            </div>
            <p className="mt-1 text-xs font-semibold text-muted-foreground">
              <time dateTime={order.createdAt}>{clockTime(order.createdAt)}</time>
              <span aria-hidden> · </span>
              {formatAge(order.createdAt)}
            </p>
            {address && (
              <p className="mt-1.5 flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="size-3.5 shrink-0" strokeWidth={2.25} aria-hidden />
                <span className="truncate" title={address}>{address}</span>
              </p>
            )}
          </div>
        </section>

        <section aria-labelledby={`order-items-${order._id}`} className="min-w-0 lg:border-s lg:border-border lg:ps-4">
          <div className="flex items-center justify-between gap-2">
            <h2
              id={`order-items-${order._id}`}
              className="text-[0.64rem] font-black tracking-[0.12em] text-muted-foreground uppercase"
            >
              Order items
            </h2>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[0.65rem] font-black text-muted-foreground">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </span>
          </div>

          <ul className="mt-1 divide-y divide-border/70">
            {order.items.map((item, index) => {
              const details = [
                ...(item.variant ? [item.variant.name] : []),
                ...item.modifiers.map((modifier) => modifier.name),
              ];
              return (
                <li
                  key={`${item.product}-${index}`}
                  className="flex min-w-0 items-center gap-2 py-1.5"
                >
                  <span className="grid h-6 min-w-7 shrink-0 place-items-center rounded-md bg-foreground px-1 text-[0.68rem] font-black text-background tabular-nums">
                    {item.quantity}×
                  </span>
                  <p className="shrink-0 text-sm font-black">{item.name}</p>
                  {details.length > 0 && (
                    <p className="min-w-0 flex-1 truncate text-xs text-muted-foreground" title={details.join(" · ")}>
                      {details.join(" · ")}
                    </p>
                  )}
                  {item.note && (
                    <p className="flex max-w-48 shrink-0 items-center gap-1 truncate rounded-md bg-accent px-2 py-1 text-xs font-semibold text-accent-foreground" title={item.note}>
                      <StickyNote className="size-3 shrink-0" strokeWidth={2.5} aria-hidden />
                      <span className="truncate">{item.note}</span>
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        <aside className="flex items-end gap-3 border-t border-border pt-3 lg:col-span-2 xl:col-span-1 xl:flex-col xl:items-stretch xl:border-t-0 xl:border-s xl:pt-0 xl:ps-4">
          <div className="min-w-24 flex-1 xl:text-center">
            <p className="text-[0.62rem] font-black tracking-[0.12em] text-muted-foreground uppercase">Total</p>
            <p className="mt-0.5 font-heading text-lg font-black">{formatPrice(order.total)}</p>
            <p className="text-xs font-semibold text-muted-foreground">{paymentMethodLabel(order.paymentMethod)}</p>
            {payment && <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[0.58rem] font-black uppercase ${payment.className}`}>{payment.label}</span>}
          </div>
          <footer className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center xl:w-full xl:flex-col xl:items-stretch">
          {confirmable ? (
            <button
              type="button"
              onClick={() => confirmOrder(order)}
              disabled={isPending}
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-black text-primary-foreground shadow-sm transition enabled:hover:-translate-y-0.5 enabled:hover:brightness-110 enabled:active:translate-y-0 disabled:opacity-50 xl:w-full"
            >
              <Check className="size-4" strokeWidth={3} aria-hidden />
              {isPending ? "Confirming…" : "Confirm order"}
            </button>
          ) : queuePosition !== undefined ? (
            <p className="flex min-h-10 items-center justify-center rounded-xl bg-amber-50 px-3 text-center text-xs font-black text-amber-900 xl:w-full">
              Waiting for payment
            </p>
          ) : null}
          <Link
            href={href}
            className="inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-xl border border-foreground/10 bg-muted/60 px-3.5 text-xs font-black text-foreground transition-colors hover:border-foreground/15 hover:bg-muted xl:w-full"
          >
            View details
            <ChevronRight className="size-3.5 rtl:rotate-180" strokeWidth={2.5} aria-hidden />
          </Link>
          </footer>
        </aside>
      </div>
    </article>
  );
}
