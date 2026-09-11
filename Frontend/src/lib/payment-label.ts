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
