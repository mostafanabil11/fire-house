import { RESTAURANT } from "@/config/restaurant";
import { addressText } from "./address-text";
import { formatPrice } from "./format";
import { paymentMethodLabel } from "./payment-label";
import type { Order } from "@/types/order";

/**
 * Everything the confirmation message needs, described structurally so both
 * the board's list rows and the full order record satisfy it.
 *
 * The money breakdown is optional because the admin list query selects a
 * narrow set of fields (see the `.select(...)` in orders.service.ts) and does
 * not carry it. A message built from a list row shows the total and skips the
 * three lines above it rather than inventing them.
 */
export interface ConfirmableOrder {
  orderNumber: string;
  items: Order["items"];
  shippingAddress?: Order["shippingAddress"] | null;
  total: number;
  paymentMethod: Order["paymentMethod"];
  paymentStatus: Order["paymentStatus"];
  user?: { firstName: string; lastName: string } | null;
  subtotal?: number;
  shippingCost?: number;
  discountAmount?: number;
  couponCode?: string | null;
}

export interface ConfirmationMessageOptions {
  restaurantName?: string;
  /** When the message is being written. Injectable so tests aren't clock-dependent. */
  now?: Date;
  /** Locale for the arrival clock time — the staff member's, since they send it. */
  locale?: string;
  /** Translator from useLanguage(); defaults to leaving the English as written. */
  t?: (value: string) => string;
}

/**
 * Whole sentences rather than glued-together fragments, because Arabic does
 * not put the pieces in English's order. The dictionary matches a whole
 * string, so these are translated first and filled in afterwards — a template
 * with no Arabic entry simply stays in English and still fills correctly.
 */
const GREETING = "Hello {name}! This is {restaurant} confirming your order {order}.";
const PAID_IN_FULL = "Paid in full: {amount} ({method}) — nothing to pay on delivery.";
const PAY_ON_DELIVERY = "To pay on delivery: {amount} ({method})";
const AMOUNT_DUE = "Amount: {amount} ({method})";

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => values[key] ?? match);
}

/**
 * The delivery promise as a clock window, counted from the moment staff sends
 * the message — which is when the kitchen is actually starting the order, not
 * when it was placed.
 */
function arrivalWindow(now: Date, locale: string): string {
  const { min, max } = RESTAURANT.deliveryEtaMinutes;
  const at = (minutes: number) =>
    new Date(now.getTime() + minutes * 60_000).toLocaleTimeString(locale, {
      hour: "numeric",
      minute: "2-digit",
    });
  return `${at(min)} – ${at(max)}`;
}

function recipientName(order: ConfirmableOrder): string {
  const fromAddress = order.shippingAddress
    ? `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`.trim()
    : "";
  if (fromAddress) return fromAddress;
  const fromAccount = order.user ? `${order.user.firstName} ${order.user.lastName}`.trim() : "";
  return fromAccount;
}

/**
 * The confirmation a staff member sends the customer over WhatsApp: when the
 * food is expected, what is in the order, where it is going, and what is left
 * to pay.
 *
 * It is written to be read on a phone by someone who has not seen this screen,
 * so every line stands on its own and nothing refers to the dashboard.
 */
export function orderConfirmationMessage(
  order: ConfirmableOrder,
  {
    restaurantName = RESTAURANT.name,
    now = new Date(),
    locale = "en-US",
    t = (value) => value,
  }: ConfirmationMessageOptions = {},
): string {
  const name = recipientName(order);
  const lines: string[] = [];

  lines.push(
    fill(t(GREETING), {
      // An order with no name at all is possible in the types; greeting the
      // customer by a blank leaves a stray space and reads as a broken mail
      // merge, so the name simply drops out of the sentence.
      name: name || t("there"),
      restaurant: restaurantName,
      order: order.orderNumber,
    }),
  );

  lines.push("", `${t("Expected arrival")}: ${arrivalWindow(now, locale)}`);

  if (order.items.length > 0) {
    lines.push("", `${t("Your order")}:`);
    for (const item of order.items) {
      // Dish, variant and add-on names are dictionary entries too, so an
      // Arabic-speaking staff member sends the menu wording the customer sees
      // on the site rather than the English the API stores.
      const details = [
        ...(item.variant ? [t(item.variant.name)] : []),
        ...item.modifiers.map((modifier) => t(modifier.name)),
      ];
      const options = details.length > 0 ? ` (${details.join(", ")})` : "";
      lines.push(`• ${item.quantity}× ${t(item.name)}${options} — ${formatPrice(item.lineTotal)}`);
      // Echoed back so the customer can see the kitchen has their request.
      if (item.note) lines.push(`   ${t("Note")}: ${item.note}`);
    }
  }

  const address = order.shippingAddress ? addressText(order.shippingAddress) : "";
  if (address) {
    lines.push("", `${t("Delivering to")}: ${address}`);
  }

  lines.push("");
  if (typeof order.subtotal === "number") {
    lines.push(`${t("Subtotal")}: ${formatPrice(order.subtotal)}`);
    if (order.shippingCost) lines.push(`${t("Delivery")}: ${formatPrice(order.shippingCost)}`);
    if (order.discountAmount) {
      const code = order.couponCode ? ` (${order.couponCode})` : "";
      lines.push(`${t("Discount")}${code}: −${formatPrice(order.discountAmount)}`);
    }
  }

  const amounts = { amount: formatPrice(order.total), method: t(paymentMethodLabel(order.paymentMethod)) };
  if (order.paymentStatus === "paid") {
    lines.push(fill(t(PAID_IN_FULL), amounts));
  } else if (order.paymentMethod === "cod") {
    lines.push(fill(t(PAY_ON_DELIVERY), amounts));
  } else {
    // Card or InstaPay that hasn't settled. Deliberately not "to pay on
    // delivery": the customer has already been asked for the money elsewhere,
    // and the rider will not be collecting it.
    lines.push(fill(t(AMOUNT_DUE), amounts));
  }

  lines.push("", t("Thank you for ordering with us!"));

  return lines.join("\n");
}
