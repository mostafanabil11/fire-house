"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusPill } from "@/components/admin/ui/status-pill";
import { formatPrice } from "@/lib/format";
import { paymentInstruction } from "@/lib/payment-label";
import { clockTime, customerName, itemsSummary, staffOrderState } from "@/lib/staff-orders";
import { T, useLanguage } from "@/i18n/language-provider";
import type { AdminOrderListItem } from "@/lib/api/orders";

/**
 * A compact, read-only line for history, search results, orders waiting on a
 * card payment, and the overview. The whole row opens the order. Its item
 * summary may be cut short — nobody cooks from this row, and the full list is
 * one tap away.
 */
export function OrderRow({ order }: { order: AdminOrderListItem }) {
  const { t } = useLanguage();
  const state = staffOrderState(order);
  const payment = paymentInstruction(order);
  const name = customerName(order);
  const phone = order.shippingAddress?.phone;

  return (
    <li>
      <Link
        href={`/admin/orders/${order.orderNumber}`}
        className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60 sm:px-5"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-base font-extrabold" data-i18n-ignore>
              {order.orderNumber}
            </span>
            <StatusPill tone={state.tone === "danger-solid" ? "danger" : state.tone}>
              {state.label}
            </StatusPill>
            <span className="text-sm text-muted-foreground">
              <time dateTime={order.createdAt}>{clockTime(order.createdAt)}</time>
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
            <p className="min-w-0 text-sm font-semibold">
              <span data-i18n-ignore>{name}</span>
              {phone && (
                <>
                  <span aria-hidden className="text-muted-foreground"> · </span>
                  <span dir="ltr" data-i18n-ignore className="text-muted-foreground tabular-nums">
                    {phone}
                  </span>
                </>
              )}
            </p>
            <p className="shrink-0 text-sm">
              <span className="font-extrabold tabular-nums">
                <T>{formatPrice(order.total)}</T>
              </span>
              <span aria-hidden className="text-muted-foreground">{" · "}</span>
              <span className="text-muted-foreground">{payment.label}</span>
            </p>
          </div>
          <p className="mt-0.5 truncate text-sm text-muted-foreground" data-i18n-ignore>
            {itemsSummary(order.items, t)}
          </p>
        </div>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      </Link>
    </li>
  );
}

export function OrderRowList({ orders }: { orders: AdminOrderListItem[] }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
      {orders.map((order) => (
        <OrderRow key={order._id} order={order} />
      ))}
    </ul>
  );
}
