"use client";

import { Truck } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { paymentSummaryLabel } from "@/lib/payment-label";
import { addressText } from "@/lib/address-text";
import { OrderItems } from "@/components/orders/order-items";
import { CancelOrderButton, isCancellable } from "@/components/orders/cancel-order-button";
import type { Order } from "@/types/order";

// canCancel is passed in rather than inferred, because being able to *see* an
// order isn't the same as being entitled to cancel it. An order reached by
// order-number-plus-email alone is read-only: that pair is knowable by other
// people, and cancelling is destructive.
export function OrderDetail({ order, canCancel = true }: { order: Order; canCancel?: boolean }) {
  return (
    <div className="mx-auto max-w-xl">
      <div className="border-t border-b border-border py-4">
        <OrderItems items={order.items} />
      </div>

      <div className="mt-6 space-y-2 text-[13px]">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-foreground">{formatPrice(order.subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Delivery fee</span>
          <span className="text-foreground">{order.shippingCost === 0 ? "Free" : formatPrice(order.shippingCost)}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Discount</span>
            <span className="text-foreground">−{formatPrice(order.discountAmount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-border pt-2 text-[15px] font-semibold">
          <span className="text-foreground">Total</span>
          <span className="text-foreground">{formatPrice(order.total)}</span>
        </div>
      </div>

      {order.trackingNumber && (
        <div className="mt-6 flex items-center justify-between border border-foreground p-4 text-[13px]">
          <span className="flex items-center gap-3 text-foreground">
            <Truck className="size-4" strokeWidth={1.5} />
            Delivery reference
          </span>
          <span className="font-medium text-foreground">{order.trackingNumber}</span>
        </div>
      )}

      <div className="mt-8 border border-border bg-muted p-6 text-[13px]">
        <p className="mb-2 text-[12px] font-semibold tracking-[0.1em] text-foreground uppercase">Deliver To</p>
        <p className="text-foreground">
          {order.shippingAddress.firstName} {order.shippingAddress.lastName}
        </p>
        <p className="text-muted-foreground">{addressText(order.shippingAddress)}</p>
        <p className="text-muted-foreground">{order.shippingAddress.phone}</p>
        <p className="mt-2 text-foreground">
          Payment: {paymentSummaryLabel(order)}
        </p>
      </div>

      {canCancel && isCancellable(order) && (
        <div className="mt-8 text-center">
          <CancelOrderButton order={order} />
        </div>
      )}
    </div>
  );
}
