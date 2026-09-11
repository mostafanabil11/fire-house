import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartSelection } from "@/types/cart";

// What a guest's browser holds. Only the customer's *choices* are stored plus
// enough display data to render the cart icon before the server has re-priced
// anything. Prices here are never trusted — see use-cart.
export interface LocalCartItem extends CartSelection {
  lineId: string;
  slug: string;
  name: string;
  image: string;
  // Optimistic display only. Cart and checkout always re-resolve through the
  // server, which is the sole authority on what anything costs.
  price: number;
}

export type LocalCartInput = Omit<LocalCartItem, "lineId">;

export function normalizeNote(note: string | null | undefined): string | null {
  const normalized = note?.trim().replace(/\s+/g, " ") ?? "";
  return normalized || null;
}

// Mirrors the backend's cart line identity (buildCartLineKey): a dish is the
// same line only when the variant, the add-ons, and the note all match. Two
// burgers with different sauces stay two lines; two identical ones merge.
export function buildLocalLineId(selection: {
  productId: string;
  variantId: string | null;
  modifierOptionIds: string[];
  note: string | null;
}): string {
  return [
    selection.productId,
    selection.variantId ?? "",
    [...selection.modifierOptionIds].sort().join(","),
    normalizeNote(selection.note) ?? "",
  ].join("|");
}

interface CartStore {
  items: LocalCartItem[];
  addItem: (item: LocalCartInput) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const note = normalizeNote(item.note);
          const lineId = buildLocalLineId({ ...item, note });
          const existing = state.items.find((i) => i.lineId === lineId);

          if (existing) {
            return {
              items: state.items.map((i) =>
                i.lineId === lineId ? { ...i, quantity: i.quantity + item.quantity } : i,
              ),
            };
          }
          return { items: [...state.items, { ...item, note, lineId }] };
        }),
      setQuantity: (lineId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.lineId !== lineId)
              : state.items.map((i) => (i.lineId === lineId ? { ...i, quantity } : i)),
        })),
      removeItem: (lineId) =>
        set((state) => ({ items: state.items.filter((i) => i.lineId !== lineId) })),
      clear: () => set({ items: [] }),
    }),
    // Bumped from "restaurant-cart": the stored line shape changed from
    // size-keyed to customization-keyed, and an old persisted cart would
    // deserialize into lines the server can no longer price.
    { name: "restaurant-cart-v2" },
  ),
);
