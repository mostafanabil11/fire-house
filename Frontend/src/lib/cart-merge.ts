import { useCartStore } from "@/store/cart";
import { addServerCartItem } from "@/lib/api/cart";

// Called once, right after login/signup succeeds. The local (guest) cart lines
// get folded into the now-authenticated customer's server cart one at a time —
// addServerCartItem already merges quantities when the dish, variant, add-ons
// and note all match, so this is safe to call even if the server cart already
// held the same customized line from another device.
export async function mergeLocalCartIntoServerCart(): Promise<void> {
  const { items, clear } = useCartStore.getState();
  if (items.length === 0) return;

  for (const item of items) {
    try {
      await addServerCartItem({
        productId: item.productId,
        variantId: item.variantId,
        modifierOptionIds: item.modifierOptionIds,
        note: item.note,
        quantity: item.quantity,
      });
    } catch {
      // Best-effort: one bad line (e.g. a dish taken off the menu since it
      // was added) shouldn't block the rest of the merge or block login.
    }
  }

  clear();
}
