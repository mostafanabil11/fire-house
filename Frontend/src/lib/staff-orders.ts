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

export function customerName(order: {
  user: { firstName: string; lastName: string } | null;
  shippingAddress: { firstName: string; lastName: string };
}): string {
  const address = `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim();
  if (address) return address;
  const account = order.user ? `${order.user.firstName} ${order.user.lastName}`.trim() : "";
  return account || "Customer";
}
