import type { Order } from "@/types/order";

type PaymentBearing = Pick<Order, "paymentMethod" | "paymentStatus">;

// How a payment method is named to the person reading it. Kept in one place
// because it is shown to the customer, to staff on the order screen, and in
// the admin list — and it previously read "Card" for anything that was not
// cash, which quietly mislabelled every InstaPay order.
export function paymentMethodLabel(method: Order["paymentMethod"]): string {
  switch (method) {
    case "cod":
      return "Cash on delivery";
    case "instapay":
      return "InstaPay";
    case "card":
      return "Card";
  }
}

/**
 * What the person at the counter needs to know about the money, in one
 * phrase, with the tone the staff screens colour it.
 */
export function paymentInstruction(order: PaymentBearing): {
  label: string;
  tone: "neutral" | "success" | "warning";
} {
  if (order.paymentStatus === "refunded") return { label: "Refunded", tone: "neutral" };
  switch (order.paymentMethod) {
    case "cod":
      return order.paymentStatus === "paid"
        ? { label: "Cash — collected", tone: "success" }
        : { label: "Cash — collect on delivery", tone: "neutral" };
    case "card":
      return order.paymentStatus === "paid"
        ? { label: "Paid by card", tone: "success" }
        : { label: "Card payment not completed", tone: "warning" };
    case "instapay":
      return order.paymentStatus === "paid"
        ? { label: "Paid by InstaPay", tone: "success" }
        : { label: "InstaPay — check the transfer", tone: "warning" };
  }
}

// The method plus where it has got to, as one line. Cash is deliberately not
// given a payment state: it is settled at the door, so "awaiting payment" on a
// cash order would read as a problem rather than as the normal case.
export function paymentSummaryLabel(order: PaymentBearing): string {
  const method = paymentMethodLabel(order.paymentMethod);

  if (order.paymentMethod === "cod") {
    return order.paymentStatus === "paid" ? "Cash — collected" : method;
  }

  switch (order.paymentStatus) {
    case "paid":
      return `${method} — paid`;
    case "refunded":
      return `${method} — refunded`;
    case "failed":
      return `${method} — payment failed`;
    default:
      return order.paymentMethod === "instapay"
        ? "InstaPay — awaiting confirmation"
        : `${method} — awaiting payment`;
  }
}
