import type { ProductSize } from "./product";

export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type FulfillmentStatus =
  | "unfulfilled"
  | "processing"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

// An immutable snapshot taken when the order was placed — the variant, the
// add-ons and the note are what the kitchen actually has to make, so they are
// stored on the order rather than looked up from the menu, which may have
// changed since.
export interface OrderItem {
  product: string;
  name: string;
  slug: string;
  color: string | null;
  size: ProductSize | null;
  variant: { id: string; name: string; priceAdjustment: number } | null;
  modifiers: { id: string; name: string; priceAdjustment: number; groupName: string }[];
  note: string | null;
  image: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface OrderShippingAddress {
  firstName: string;
  lastName: string;
  phone: string;
  addressLine: string;
  city: string;
  governorate: string;
  postalCode: string | null;
}

export interface Order {
  _id: string;
  orderNumber: string;
  // Present when a signed-in customer placed the order; guests have
  // guestEmail instead, and both have a shippingAddress.
  guestEmail?: string | null;
  items: OrderItem[];
  shippingAddress: OrderShippingAddress;
  subtotal: number;
  shippingCost: number;
  discountAmount: number;
  couponCode: string | null;
  total: number;
  currency: string;
  paymentMethod: "cod" | "card" | "instapay";
  // Set only on InstaPay orders: the transfer reference the customer quoted,
  // which staff match against the money that arrived.
  paymentReference: string | null;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  trackingNumber: string | null;
  createdAt: string;
}

export interface OrderSummary {
  orderNumber: string;
  items: OrderItem[];
  total: number;
  currency: string;
  paymentStatus: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;
  createdAt: string;
}
