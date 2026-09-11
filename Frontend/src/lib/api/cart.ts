import { apiClient } from "./client";
import type { CartLine, CartSelection, ResolvedCart, ResolvedCartLine } from "@/types/cart";

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

type ServerCart = Omit<ResolvedCart, "items"> & { items: ResolvedCartLine[] };

// The wire shape the backend's cartItemSchema accepts.
export interface CartItemPayload {
  productId: string;
  variantId?: string;
  modifierOptionIds: string[];
  note?: string;
  quantity: number;
}

export function toCartItemPayload(selection: CartSelection): CartItemPayload {
  return {
    productId: selection.productId,
    variantId: selection.variantId ?? undefined,
    modifierOptionIds: selection.modifierOptionIds,
    note: selection.note ?? undefined,
    quantity: selection.quantity,
  };
}

// Turns already-resolved lines back into a statement of intent for checkout
// and coupon validation. The customer's choices survive the round trip; every
// price is recalculated server-side from live menu data.
export function cartLinesToPayload(items: CartLine[]): CartItemPayload[] {
  return items.map((line) =>
    toCartItemPayload({
      productId: line.productId,
      variantId: line.variant?.id ?? null,
      modifierOptionIds: line.modifiers.map((modifier) => modifier.id),
      note: line.note,
      quantity: line.quantity,
    }),
  );
}

// Public — usable before login, to re-price a guest's local cart the same
// way the authenticated endpoints below re-price the server cart. Lines come
// back in the order they were sent, one for one.
export async function validateCart(selections: CartSelection[]): Promise<ServerCart> {
  const res = await apiClient.post<ApiEnvelope<ServerCart>>("/cart/validate", {
    items: selections.map(toCartItemPayload),
  });
  return res.data.data;
}

export async function getServerCart(): Promise<ServerCart> {
  const res = await apiClient.get<ApiEnvelope<ServerCart>>("/cart");
  return res.data.data;
}

export async function addServerCartItem(selection: CartSelection): Promise<ServerCart> {
  const res = await apiClient.post<ApiEnvelope<ServerCart>>("/cart/items", toCartItemPayload(selection));
  return res.data.data;
}

export async function updateServerCartLine(lineKey: string, quantity: number): Promise<ServerCart> {
  const res = await apiClient.patch<ApiEnvelope<ServerCart>>(`/cart/items/${lineKey}`, { quantity });
  return res.data.data;
}

export async function removeServerCartLine(lineKey: string): Promise<ServerCart> {
  const res = await apiClient.delete<ApiEnvelope<ServerCart>>(`/cart/items/${lineKey}`);
  return res.data.data;
}

export async function clearServerCart(): Promise<void> {
  await apiClient.delete("/cart");
}
