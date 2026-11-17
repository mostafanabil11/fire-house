"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateOrderStatus } from "@/lib/api/orders";
import { useLanguage } from "@/i18n/language-provider";

/**
 * The staff "Confirm order" mutation. Asking first (an InstaPay transfer has
 * to be checked in the bank app) is ConfirmOrderButton's job, so the board
 * and the order page ask the same question the same way.
 */
export function useConfirmOrder() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const mutation = useMutation({
    mutationFn: (orderNumber: string) =>
      updateOrderStatus(orderNumber, { fulfillmentStatus: "confirmed" }),
    onSuccess: (order) => {
      toast.success(t(`${order.orderNumber} confirmed`));
      // Covers the board, the order page, the overview and the nav badge.
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error(t(message ?? "Could not confirm order"));
    },
  });

  return {
    confirmOrder: (orderNumber: string, options?: { onSuccess?: () => void }) =>
      mutation.mutate(orderNumber, { onSuccess: options?.onSuccess }),
    isPending: mutation.isPending,
  };
}
