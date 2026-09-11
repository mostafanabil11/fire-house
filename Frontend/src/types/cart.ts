import type { ProductSize } from "./product";

export type CartLineUnavailableReason =
  | "ok"
  | "invalid_product"
  | "not_found"
  | "inactive"
  | "unavailable"
  | "out_of_stock"
  | "invalid_customization";

export interface ResolvedVariant {
  id: string;
  name: string;
  priceAdjustment: number;
}

export interface ResolvedModifier {
  id: string;
  name: string;
  priceAdjustment: number;
  groupId: string;
  groupName: string;
}

// What the customer chose. This is the only part of a line the client owns —
// everything priced is re-derived by the server from live menu data.
export interface CartSelection {
  productId: string;
  variantId: string | null;
  modifierOptionIds: string[];
  note: string | null;
  quantity: number;
}

// Mirrors the backend's ResolvedCartLine. Every priced field here comes from
// re-pricing against the live menu record, never from anything the client
// sent. `unitPrice`/`name`/etc. are null only when `available` is false.
export interface ResolvedCartLine {
  lineKey: string;
  productId: string;
  size: ProductSize | null;
  variant: ResolvedVariant | null;
  modifiers: ResolvedModifier[];
  note: string | null;
  available: boolean;
  reason: CartLineUnavailableReason;
  customizationError: string | null;
  requestedQuantity: number;
  quantity: number;
  availableStock: number | null;
  unitPrice: number | null;
  lineTotal: number;
  name: string | null;
  slug: string | null;
  color: string | null;
  image: string | null;
  categoryId: string | null;
  onSale: boolean;
}

// A resolved line plus the handle the UI uses to change it. For a signed-in
// customer that is the server's own line key; for a guest it is the local
// store's deterministic id. The UI never needs to know which.
export interface CartLine extends ResolvedCartLine {
  key: string;
}

export interface ResolvedCart {
  items: CartLine[];
  subtotal: number;
  // True when the server's view no longer matches what was requested —
  // a price changed, an item sold out, a quantity got clamped, a dish came
  // off the menu. The UI should surface this rather than silently proceeding.
  hasChanges: boolean;
}
