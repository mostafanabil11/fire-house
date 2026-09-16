import type { FulfillmentStatus, Order } from "@/types/order";

export type OrderStage = "placed" | "kitchen" | "delivery" | "delivered";

export interface OrderStep {
  key: OrderStage;
  label: string;
  /** What this step means while it is the one being waited on. */
  hint: string;
  state: "done" | "current" | "upcoming";
}

// Where each fulfilment status sits on the customer-facing journey. The
// backend keeps two statuses before a human accepts the order (`unfulfilled`
// for cash, `processing` once a card payment lands); both read as "with the
// kitchen" to the person waiting for food, so they collapse into one step.
const STAGE_BY_STATUS: Record<Exclude<FulfillmentStatus, "cancelled">, OrderStage> = {
  unfulfilled: "placed",
  processing: "placed",
  confirmed: "kitchen",
  shipped: "delivery",
  delivered: "delivered",
};

const STAGE_ORDER: OrderStage[] = ["placed", "kitchen", "delivery", "delivered"];

const STAGE_COPY: Record<OrderStage, { label: string; hint: string }> = {
  placed: { label: "Order placed", hint: "We have your order and are checking it now." },
  kitchen: { label: "In the kitchen", hint: "Your food is being cooked fresh to order." },
  delivery: { label: "Out for delivery", hint: "Your driver is on the way to you." },
  delivered: { label: "Delivered", hint: "Enjoy your food." },
};

/**
 * The journey as four steps, with the one currently in progress marked.
 *
 * The step a status maps to is the step that has been *reached*, so it is
 * shown as done and the next one as current — an order sitting at `confirmed`
 * is in the kitchen, not waiting to enter it. The last stage is the exception:
 * once delivered there is nothing left to wait for.
 */
export function orderSteps(status: FulfillmentStatus): OrderStep[] {
  if (status === "cancelled") return [];

  const reachedIndex = STAGE_ORDER.indexOf(STAGE_BY_STATUS[status]);
  const currentIndex = status === "delivered" ? reachedIndex : reachedIndex + 1;

  return STAGE_ORDER.map((key, index) => ({
    key,
    ...STAGE_COPY[key],
    state: index < currentIndex ? "done" : index === currentIndex ? "current" : "upcoming",
  }));
}

/**
 * The delivery window as clock times — "19:40 – 19:50" — counted from when the
 * order was placed. The restaurant quotes a range rather than a single time
 * everywhere else on the site, so this keeps that promise in the customer's
 * own words instead of inventing a precision the kitchen hasn't offered.
 *
 * Returns null for an order that is no longer coming, and for an unparseable
 * date rather than rendering "Invalid Date" at the customer.
 */
export function deliveryWindow(
  order: Pick<Order, "createdAt" | "fulfillmentStatus">,
  minMinutes = 30,
  maxMinutes = 40,
): { from: string; to: string } | null {
  if (order.fulfillmentStatus === "cancelled" || order.fulfillmentStatus === "delivered") return null;

  const placedAt = new Date(order.createdAt);
  if (Number.isNaN(placedAt.getTime())) return null;

  const at = (minutes: number) =>
    new Date(placedAt.getTime() + minutes * 60_000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  return { from: at(minMinutes), to: at(maxMinutes) };
}
