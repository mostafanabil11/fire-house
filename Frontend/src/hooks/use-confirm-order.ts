"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { updateOrderStatus } from "@/lib/api/orders";
import { confirmWarning } from "@/lib/staff-orders";
import type { Order } from "@/types/order";

/**
 * The staff "Confirm order" action, shared by the board card and the order
 * page. Asks first only when confirming would also mark a transfer paid.
 */
export function useConfirmOrder() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (orderNumber: string) =>
      updateOrderStatus(orderNumber, { fulfillmentStatus: "confirmed" }),
    onSuccess: (order) => {
      toast.success(`${order.orderNumber} confirmed`);
      // Covers the board, the order page and the dashboard's waiting list.
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: (err: unknown) => {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data
        ?.message;
      toast.error(message ?? "Could not confirm order");
    },
  });

  function confirmOrder(
    order: Pick<Order, "orderNumber" | "paymentMethod" | "paymentStatus" | "fulfillmentStatus">,
  ) {
    const warning = confirmWarning(order);
    if (warning && !window.confirm(warning)) return;
    mutation.mutate(order.orderNumber);
  }

  return { confirmOrder, isPending: mutation.isPending };
}
