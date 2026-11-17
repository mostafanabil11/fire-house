import type { FulfillmentStatus, Order, PaymentStatus } from "@/types/order";

export type StaffQueue = "waiting" | "confirmed" | "cancelled";

/**
 * The groups the team works in, mapped onto the fulfilment statuses the
 * backend stores. An order is waiting until someone presses Confirm.
 *
 * "Waiting" holds two statuses: an order awaiting payment confirmation and
 * one ready to be accepted are both sitting on someone's desk. "Confirmed"
 * also holds shipped and delivered so orders from the older, longer flow
 * still have a tab to live in.
 */
export const STAFF_QUEUES: {
  key: StaffQueue;
  label: string;
  statuses: FulfillmentStatus[];
}[] = [
  { key: "waiting", label: "Waiting", statuses: ["unfulfilled", "processing"] },
  { key: "confirmed", label: "Confirmed", statuses: ["confirmed", "shipped", "delivered"] },
  { key: "cancelled", label: "Cancelled", statuses: ["cancelled"] },
];

export function queueStatuses(queue: StaffQueue): FulfillmentStatus[] {
  return STAFF_QUEUES.find((q) => q.key === queue)?.statuses ?? [];
}

interface StatusBearing {
  fulfillmentStatus: FulfillmentStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: Order["paymentMethod"];
}

/**
 * Whether staff can confirm this order. A card order sitting unpaid is a
 * payment that never completed — there is nothing to do but wait or cancel.
 */
export function canConfirm(order: StatusBearing): boolean {
  if (!["unfulfilled", "processing"].includes(order.fulfillmentStatus)) return false;
  return !(order.paymentMethod === "card" && order.paymentStatus !== "paid");
}

/**
 * What to ask before confirming, or null when one press is enough. Confirming
 * an InstaPay order also marks it paid, so the transfer has to be checked in
 * the bank app first.
 */
export function confirmWarning(order: StatusBearing & { orderNumber: string }): string | null {
  if (order.paymentMethod === "instapay" && order.paymentStatus === "pending") {
    return `Check the InstaPay transfer for ${order.orderNumber} arrived. Confirming marks it paid.`;
  }
  return null;
}

/** Minutes since the order was placed. */
export function ageInMinutes(createdAt: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
}

export function formatAge(createdAt: string): string {
  const minutes = ageInMinutes(createdAt);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// An order nobody has touched for this long is the thing most likely to have
// been missed, so the board calls it out rather than leaving it to scroll by.
export const OVERDUE_AFTER_MINUTES = 15;

export function isOverdue(order: { createdAt: string; fulfillmentStatus: FulfillmentStatus }): boolean {
  return (
    ["unfulfilled", "processing"].includes(order.fulfillmentStatus) &&
    ageInMinutes(order.createdAt) >= OVERDUE_AFTER_MINUTES
  );
}

// Halfway to overdue: worth a glance, not yet a problem.
export const AGING_AFTER_MINUTES = 10;

const WAITING: FulfillmentStatus[] = ["unfulfilled", "processing"];

export function isWaiting(order: { fulfillmentStatus: FulfillmentStatus }): boolean {
  return WAITING.includes(order.fulfillmentStatus);
}

export type Urgency = "fresh" | "aging" | "late";

/** How long a waiting order has been sitting, as three levels the board colours. */
export function orderUrgency(order: { createdAt: string }): Urgency {
  const minutes = ageInMinutes(order.createdAt);
  if (minutes >= OVERDUE_AFTER_MINUTES) return "late";
  if (minutes >= AGING_AFTER_MINUTES) return "aging";
  return "fresh";
}

export type StaffTone = "neutral" | "success" | "warning" | "danger" | "danger-solid";

export type StaffOrderKind = "to_confirm" | "awaiting_payment" | "confirmed" | "cancelled";

/**
 * Where an order stands for the person at the counter, as one label. Shared by
 * the board, the order page and the overview so they never disagree.
 */
export function staffOrderState(
  order: StatusBearing & { createdAt: string },
): { kind: StaffOrderKind; tone: StaffTone; label: string } {
  if (order.fulfillmentStatus === "cancelled") {
    return { kind: "cancelled", tone: "neutral", label: "Cancelled" };
  }
  if (!isWaiting(order)) return { kind: "confirmed", tone: "success", label: "Confirmed" };
  // Still waiting, but not on us: a card payment that never completed.
  if (!canConfirm(order)) {
    return { kind: "awaiting_payment", tone: "warning", label: "Awaiting card payment" };
  }
  if (isOverdue(order)) return { kind: "to_confirm", tone: "danger-solid", label: "Waiting too long" };
  return { kind: "to_confirm", tone: "danger", label: "Needs confirmation" };
}

/** Timer text for a waiting order: "just now", "8 min", "1h 05m", "2d". */
export function formatElapsed(createdAt: string): string {
  const minutes = ageInMinutes(createdAt);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${String(minutes % 60).padStart(2, "0")}m`;
  return `${Math.floor(hours / 24)}d`;
}

export function clockTime(iso: string): string {
  // A fixed English format so the Arabic dictionary can match it; the
  // browser's own locale would print whatever the device is set to.
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function byOldest<T extends { createdAt: string }>(orders: T[]): T[] {
  return orders.toSorted(
    (first, second) => new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime(),
  );
}

/**
 * The waiting queue as staff work it: orders they can confirm, and card
 * orders that are only waiting on the customer's bank. Each oldest first —
 * the order that has waited longest is always at the top.
 */
export function splitWaiting<T extends StatusBearing & { createdAt: string }>(
  orders: T[],
): { toConfirm: T[]; awaitingPayment: T[] } {
  const waiting = byOldest(orders.filter(isWaiting));
  return {
    toConfirm: waiting.filter(canConfirm),
    awaitingPayment: waiting.filter((order) => !canConfirm(order)),
  };
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/** Newest first, under "Today", "Yesterday" or a short date. */
export function groupByDay<T extends { createdAt: string }>(
  orders: T[],
): { label: string; orders: T[] }[] {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const groups = new Map<string, { label: string; orders: T[] }>();
  for (const order of orders.toSorted(
    (first, second) => new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime(),
  )) {
    const date = new Date(order.createdAt);
    const key = dayKey(date);
    if (!groups.has(key)) {
      const label =
        key === dayKey(today)
          ? "Today"
          : key === dayKey(yesterday)
            ? "Yesterday"
            : date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      groups.set(key, { label, orders: [] });
    }
    groups.get(key)!.orders.push(order);
  }
  return [...groups.values()];
}

/** "2× Fried Chicken Meal, 2× Mirinda +2 more" — for rows nobody cooks from. */
export function itemsSummary(
  items: { name: string; quantity: number }[],
  translate: (value: string) => string = (value) => value,
  shown = 2,
): string {
  const head = items
    .slice(0, shown)
    .map((item) => `${item.quantity}× ${translate(item.name)}`)
    .join(", ");
  return items.length > shown ? `${head} ${translate(`+${items.length - shown} more`)}` : head;
}

export function customerName(order: {
  user: { firstName: string; lastName: string } | null;
  shippingAddress: { firstName: string; lastName: string };
}): string {
  const address = `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim();
  if (address) return address;
  const account = order.user ? `${order.user.firstName} ${order.user.lastName}`.trim() : "";
  return account || "Customer";
}
