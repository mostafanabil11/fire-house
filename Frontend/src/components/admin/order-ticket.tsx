"use client";

import Link from "next/link";
import { AlertTriangle, Clock, Phone } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/social-icons";
import { StatusPill } from "@/components/admin/ui/status-pill";
import { OrderItemLines } from "@/components/admin/order-item-lines";
import { ConfirmOrderButton } from "@/components/admin/confirm-order-button";
import { formatPrice } from "@/lib/format";
import { paymentInstruction } from "@/lib/payment-label";
import { whatsAppLink, telLink } from "@/lib/contact-links";
import { orderConfirmationMessage } from "@/lib/order-confirmation-message";
import { addressText } from "@/lib/address-text";
import {
  canConfirm,
  clockTime,
  customerName,
  formatElapsed,
  orderUrgency,
  staffOrderState,
} from "@/lib/staff-orders";
import { useLanguage, T } from "@/i18n/language-provider";
import { RESTAURANT } from "@/config/restaurant";
import { cn } from "@/lib/utils";
import type { AdminOrderListItem } from "@/lib/api/orders";

const TIMER_TONE = { fresh: "neutral", aging: "warning", late: "danger-solid" } as const;

export function ContactButtons({
  phone,
  name,
  message,
  className,
}: {
  phone: string | null | undefined;
  name: string;
  message: string;
  className?: string;
}) {
  const call = telLink(phone);
  const chat = whatsAppLink(phone, message);
  if (!call && !chat) return null;
  return (
    <div className={cn("flex shrink-0 gap-2", className)}>
      {call && (
        <a
          href={call}
          aria-label={`Call ${name}`}
          title="Call"
          className="grid size-11 place-items-center rounded-full border border-border bg-background transition-colors hover:bg-muted"
        >
          <Phone className="size-5" strokeWidth={2.25} aria-hidden />
        </a>
      )}
      {chat && (
        <a
          href={chat}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Chat with ${name} on WhatsApp`}
          title="WhatsApp"
          className="grid size-11 place-items-center rounded-full bg-[#25D366] text-white transition hover:brightness-105"
        >
          <WhatsAppIcon className="size-5" aria-hidden />
        </a>
      )}
    </div>
  );
}

/**
 * One order staff can act on, read top to bottom: how long it has waited,
 * what to make, who for, the money, and the button. No columns at any width
 * — a ticket reads the same on a phone and on the counter screen.
 */
export function OrderTicket({
  order,
  isNew = false,
  onSeen,
}: {
  order: AdminOrderListItem;
  isNew?: boolean;
  onSeen?: () => void;
}) {
  const { isArabic, t } = useLanguage();
  const name = customerName(order);
  const phone = order.shippingAddress?.phone ?? null;
  const call = telLink(phone);
  const address = order.shippingAddress ? addressText(order.shippingAddress) : "";
  const urgency = orderUrgency(order);
  const state = staffOrderState(order);
  const payment = paymentInstruction(order);
  const href = `/admin/orders/${order.orderNumber}`;
  const headingId = `order-${order._id}`;
  // A list row carries no money breakdown, so this states the total alone.
  const message = orderConfirmationMessage(order, {
    restaurantName: RESTAURANT.name,
    locale: isArabic ? "ar-EG" : "en-US",
    t,
  });

  return (
    <article
      aria-labelledby={headingId}
      onPointerDown={isNew ? onSeen : undefined}
      className={cn(
        "flex flex-col rounded-2xl border bg-card shadow-[0_2px_12px_rgb(0_0_0/0.04)]",
        urgency === "late" ? "border-2 border-danger-strong" : "border-border",
        isNew && "ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      <header className="flex items-start justify-between gap-3 px-4 pt-4 sm:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 id={headingId} className="text-lg leading-tight font-extrabold" data-i18n-ignore>
              <Link href={href} className="hover:underline">
                {order.orderNumber}
              </Link>
            </h3>
            {isNew && <StatusPill tone="danger-solid" className="bg-primary">New</StatusPill>}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <time dateTime={order.createdAt}>{clockTime(order.createdAt)}</time>
            <StatusPill
              tone={state.tone}
              icon={state.tone === "danger-solid" ? <AlertTriangle aria-hidden /> : undefined}
            >
              {state.label}
            </StatusPill>
          </div>
        </div>
        <StatusPill tone={TIMER_TONE[urgency]} icon={<Clock aria-hidden />} className="px-3 py-1.5 text-sm">
          {formatElapsed(order.createdAt)}
        </StatusPill>
      </header>

      <div className="mt-4 border-t border-border px-4 py-4 sm:px-5">
        <OrderItemLines items={order.items} />
      </div>

      <div className="flex items-start gap-3 border-t border-border px-4 py-3.5 sm:px-5">
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold break-words" data-i18n-ignore>
            {name}
          </p>
          {call ? (
            <a
              href={call}
              dir="ltr"
              data-i18n-ignore
              className="mt-0.5 inline-block text-base font-semibold tabular-nums hover:text-primary"
            >
              {phone}
            </a>
          ) : (
            <p dir="ltr" data-i18n-ignore className="mt-0.5 text-sm text-muted-foreground">
              {phone || "—"}
            </p>
          )}
          {address && (
            <p
              className="mt-1 line-clamp-2 text-sm text-muted-foreground"
              title={address}
              data-i18n-ignore
            >
              {address}
            </p>
          )}
        </div>
        <ContactButtons phone={phone} name={name} message={message} />
      </div>

      <footer className="mt-auto border-t border-border px-4 pt-3.5 pb-4 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-heading text-xl tabular-nums">
            <T>{formatPrice(order.total)}</T>
          </p>
          <StatusPill tone={payment.tone}>{payment.label}</StatusPill>
        </div>
        {order.paymentMethod === "instapay" && order.paymentReference && (
          <p className="mt-1 text-end text-sm text-muted-foreground">
            <span>Ref</span>{" "}
            <span dir="ltr" data-i18n-ignore className="font-bold text-foreground">
              {order.paymentReference}
            </span>
          </p>
        )}
        {canConfirm(order) && <ConfirmOrderButton order={order} className="mt-3" />}
        <Link
          href={href}
          className="mt-1 flex min-h-11 items-center justify-center text-sm font-bold text-muted-foreground hover:text-foreground"
        >
          View details
        </Link>
      </footer>
    </article>
  );
}
