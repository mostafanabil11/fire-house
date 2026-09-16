"use client";

import { useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cancelOrder } from "@/lib/api/orders";
import type { Order } from "@/types/order";

// A customer can only back out before any money has actually moved — see
// OrdersService.cancelOrder on the backend for why paymentStatus is the
// deciding factor rather than fulfillmentStatus alone.
export function isCancellable(order: Order) {
  return order.paymentStatus === "pending" && ["unfulfilled", "processing"].includes(order.fulfillmentStatus);
}

/**
 * The cancel control and its confirm step. Shared so the confirmation page and
 * the order views behind it cannot drift apart on when cancelling is offered
 * or what it warns about.
 */
export function CancelOrderButton({ order }: { order: Order }) {
  const queryClient = useQueryClient();
  const [confirming, setConfirming] = useState(false);

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(order.orderNumber),
    onSuccess: (updated) => {
      queryClient.setQueryData(["orders", order.orderNumber], updated);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      toast.success("Order cancelled");
      setConfirming(false);
    },
    onError: (err: unknown) => {
      const message = axios.isAxiosError<{ message?: string }>(err)
        ? err.response?.data?.message
        : undefined;
      toast.error(message ?? "Could not cancel this order");
      setConfirming(false);
    },
  });

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-[13px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
      >
        Cancel this order
      </button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-[13px] font-bold text-foreground">Cancel this order? This can&apos;t be undone.</p>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => cancelMutation.mutate()}
          disabled={cancelMutation.isPending}
          className="min-h-11 rounded-full border-2 border-destructive px-5 text-[13px] font-black text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
        >
          {cancelMutation.isPending ? "Cancelling…" : "Yes, cancel order"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={cancelMutation.isPending}
          className="min-h-11 rounded-full border-2 border-border px-5 text-[13px] font-black text-foreground transition-colors hover:bg-muted"
        >
          Never mind
        </button>
      </div>
    </div>
  );
}
