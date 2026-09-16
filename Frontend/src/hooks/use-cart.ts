"use client";

import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "./use-current-user";
import { useHydrated } from "./use-hydrated";
import { useCartStore, buildLocalLineId, normalizeNote } from "@/store/cart";
import type { LocalCartInput } from "@/store/cart";
import {
  getServerCart,
  addServerCartItem,
  updateServerCartLine,
  removeServerCartLine,
  validateCart,
} from "@/lib/api/cart";
import type { CartLine, CartSelection, ResolvedCart } from "@/types/cart";

const EMPTY_CART: ResolvedCart = { items: [], subtotal: 0, hasChanges: false };

// Two cart sources behind one interface: signed-in customers read/write the
// real server cart directly, so it is what checkout will also see. Guests keep
// using the local zustand store as a holding pen — still re-priced through the
// same public /cart/validate endpoint the server cart uses internally, so a
// guest never sees a price the server wouldn't also charge. The local store is
// merged into the server cart on login (see the login page's onSuccess).
//
// Either way the UI works in terms of an opaque line `key`: the server's line
// key when signed in, the local deterministic id when not.
export function useCart() {
  const { data: user, isLoading: authLoading } = useCurrentUser();
  const hydrated = useHydrated();
  const isAuthenticated = !!user;
  const queryClient = useQueryClient();

  const localItems = useCartStore((s) => s.items);
  const localAddItem = useCartStore((s) => s.addItem);
  const localSetQuantity = useCartStore((s) => s.setQuantity);
  const localRemoveItem = useCartStore((s) => s.removeItem);

  const serverCartQuery = useQuery({
    queryKey: ["cart", "server"],
    queryFn: getServerCart,
    enabled: isAuthenticated,
  });

  const localSelections: CartSelection[] = useMemo(
    () =>
      localItems.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        modifierOptionIds: i.modifierOptionIds,
        note: i.note,
        quantity: i.quantity,
      })),
    [localItems],
  );

  const localValidationKey = localItems.map((i) => `${i.lineId}:${i.quantity}`).join("|");
  const localValidateQuery = useQuery({
    queryKey: ["cart", "local-validate", localValidationKey],
    queryFn: () => validateCart(localSelections),
    enabled: hydrated && !authLoading && !isAuthenticated && localItems.length > 0,
  });

  const cart: ResolvedCart = useMemo(() => {
    if (isAuthenticated) {
      const data = serverCartQuery.data;
      if (!data) return EMPTY_CART;
      // Signed in, the server's own line key is the handle.
      return { ...data, items: data.items.map((line) => ({ ...line, key: line.lineKey })) };
    }

    if (localItems.length === 0) return EMPTY_CART;
    const data = localValidateQuery.data;
    if (!data) return EMPTY_CART;

    // /cart/validate answers one line per line sent, in order, so the local id
    // that produced each resolved line is the one at the same index.
    return {
      ...data,
      items: data.items.map((line, index) => ({
        ...line,
        key: localItems[index]?.lineId ?? line.lineKey,
      })),
    };
  }, [isAuthenticated, serverCartQuery.data, localValidateQuery.data, localItems]);

  const isLoading = !hydrated || authLoading || (isAuthenticated ? serverCartQuery.isLoading : localValidateQuery.isFetching);
  // A 401 from the profile endpoint simply means this is a guest. Only the
  // active cart source is considered a cart error.
  const isError = isAuthenticated ? serverCartQuery.isError : localValidateQuery.isError;

  const addItemMutation = useMutation({
    mutationFn: (selection: CartSelection) => addServerCartItem(selection),
    onSuccess: (data) => queryClient.setQueryData(["cart", "server"], data),
  });

  const setQuantityMutation = useMutation({
    mutationFn: (vars: { lineKey: string; quantity: number }) =>
      updateServerCartLine(vars.lineKey, vars.quantity),
    onSuccess: (data) => queryClient.setQueryData(["cart", "server"], data),
  });

  const removeLineMutation = useMutation({
    mutationFn: (lineKey: string) => removeServerCartLine(lineKey),
    onSuccess: (data) => queryClient.setQueryData(["cart", "server"], data),
  });

  // `display` is what the guest cart shows before the server has answered.
  async function addItem(selection: CartSelection, display: Pick<LocalCartInput, "slug" | "name" | "image" | "price">) {
    const normalized: CartSelection = { ...selection, note: normalizeNote(selection.note) };

    if (isAuthenticated) {
      await addItemMutation.mutateAsync(normalized);
    } else {
      localAddItem({ ...normalized, ...display });
    }
  }

  function setQuantity(key: string, quantity: number) {
    if (isAuthenticated) {
      setQuantityMutation.mutate({ lineKey: key, quantity });
    } else {
      localSetQuantity(key, quantity);
    }
  }

  function removeItem(key: string) {
    if (isAuthenticated) {
      removeLineMutation.mutate(key);
    } else {
      localRemoveItem(key);
    }
  }

  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  return {
    cart,
    isLoading,
    isError,
    retry: () => isAuthenticated ? serverCartQuery.refetch() : localValidateQuery.refetch(),
    isAuthenticated,
    itemCount,
    addItem,
    setQuantity,
    removeItem,
  };
}

export type { CartLine };
export { buildLocalLineId };
