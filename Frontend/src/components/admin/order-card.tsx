"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Check,
  ChevronRight,
  MessageCircle,
  Phone,
  StickyNote,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import { paymentMethodLabel } from "@/lib/payment-label";
import { whatsAppLink, telLink, orderChatMessage } from "@/lib/contact-links";
import { canConfirm, customerName, formatAge, isOverdue } from "@/lib/staff-orders";
import { useConfirmOrder } from "@/hooks/use-confirm-order";
import { RESTAURANT } from "@/config/restaurant";
import type { AdminOrderListItem } from "@/lib/api/orders";

export function OrderCard({ order }: { order: AdminOrderListItem }) {
  const name = customerName(order);
  const phone = order.shippingAddress?.phone ?? null;
  const chat = whatsAppLink(phone, orderChatMessage(RESTAURANT.name, order.orderNumber));
  const call = telLink(phone);
  const overdue = isOverdue(order);
  const confirmable = canConfirm(order);
  const { confirmOrder, isPending } = useConfirmOrder();
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const unpaid = order.paymentStatus !== "paid" && order.paymentMethod !== "cod";

  return (
    <article
      className={`rounded-2xl border bg-card p-4 transition-colors ${
        overdue ? "border-destructive/60 bg-destructive/[0.04]" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/orders/${order.orderNumber}`}
              className="font-heading text-base font-black tracking-tight hover:underline"
            >
              {order.orderNumber}
            </Link>
            {overdue && (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-2 py-0.5 text-[0.65rem] font-black text-white uppercase">
                <AlertTriangle className="size-3" strokeWidth={2.5} aria-hidden />
                Waiting
              </span>
            )}
          </div>
          <p className="mt-0.5 text-sm font-bold">{name}</p>
          <p className="text-xs text-muted-foreground">
            {formatAge(order.createdAt)} · {itemCount} item{itemCount === 1 ? "" : "s"}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-black">{formatPrice(order.total)}</p>
          <p
            className={`text-xs font-bold ${unpaid ? "text-destructive" : "text-muted-foreground"}`}
          >
            {paymentMethodLabel(order.paymentMethod)}
            {order.paymentStatus === "paid" ? " · paid" : unpaid ? " · unpaid" : ""}
          </p>
        </div>
      </div>

      {/* What the kitchen has to make, readable from arm's length: quantity,
          dish, then every choice and note — the difference between a correct
          order and a remake. */}
      <ul className="mt-3 grid gap-2.5 rounded-xl bg-muted/60 p-3">
        {order.items.map((item, index) => {
          const details = [
            ...(item.variant ? [item.variant.name] : []),
            ...item.modifiers.map((modifier) => modifier.name),
          ];
          return (
            <li key={`${item.product}-${index}`} className="flex items-start gap-2.5">
              <span className="grid h-8 min-w-8 shrink-0 place-items-center rounded-lg bg-foreground px-1.5 text-sm font-black text-background">
                {item.quantity}×
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-base leading-8 font-black">{item.name}</p>
                {details.length > 0 && (
                  <p className="text-sm font-semibold text-foreground/75">{details.join(" · ")}</p>
                )}
                {item.note && (
                  <p className="mt-1 flex items-start gap-1.5 rounded-lg bg-accent px-2 py-1 text-sm font-bold text-accent-foreground">
                    <StickyNote className="mt-0.5 size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
                    {item.note}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {chat && (
          <a
            href={chat}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 text-xs font-black text-white"
          >
            <MessageCircle className="size-4" strokeWidth={2.5} aria-hidden />
            WhatsApp
          </a>
        )}
        {call && (
          <a
            href={call}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-3.5 text-xs font-bold"
          >
            <Phone className="size-3.5" strokeWidth={2.5} aria-hidden />
            {phone}
          </a>
        )}
        {/* No usable number: show what the customer typed rather than a link
            that would dial nothing. */}
        {!call && phone && <span className="text-xs text-muted-foreground">{phone}</span>}

        {confirmable ? (
          <button
            type="button"
            onClick={() => confirmOrder(order)}
            disabled={isPending}
            className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-full bg-foreground px-4 text-xs font-black text-background disabled:opacity-50"
          >
            <Check className="size-3.5" strokeWidth={3} aria-hidden />
            {isPending ? "Confirming…" : "Confirm order"}
          </button>
        ) : (
          <Link
            href={`/admin/orders/${order.orderNumber}`}
            className="ml-auto inline-flex min-h-10 items-center gap-1 rounded-full border border-border px-4 text-xs font-bold"
          >
            Open
            <ChevronRight className="size-3.5" strokeWidth={2.5} aria-hidden />
          </Link>
        )}
      </div>
    </article>
  );
}
