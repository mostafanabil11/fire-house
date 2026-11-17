"use client";

import { useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { useConfirmOrder } from "@/hooks/use-confirm-order";
import { confirmWarning, customerName } from "@/lib/staff-orders";
import { formatPrice } from "@/lib/format";
import { T } from "@/i18n/language-provider";
import { cn } from "@/lib/utils";
import type { Order } from "@/types/order";

type ConfirmableOrder = Pick<
  Order,
  | "orderNumber"
  | "paymentMethod"
  | "paymentStatus"
  | "fulfillmentStatus"
  | "total"
  | "paymentReference"
  | "shippingAddress"
> & { user: { firstName: string; lastName: string } | null };

/**
 * The one action on the staff screens. Cash, or a card already paid, is a
 * single press. An InstaPay order asks first, in plain words, because
 * confirming it also records the money as received.
 */
export function ConfirmOrderButton({
  order,
  className,
}: {
  order: ConfirmableOrder;
  className?: string;
}) {
  const { confirmOrder, isPending } = useConfirmOrder();
  const [asking, setAsking] = useState(false);
  const needsCheck = confirmWarning(order) !== null;

  return (
    <>
      <button
        type="button"
        onClick={() => (needsCheck ? setAsking(true) : confirmOrder(order.orderNumber))}
        disabled={isPending}
        className={cn(
          "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-base font-extrabold text-primary-foreground shadow-sm transition enabled:hover:brightness-110 enabled:active:translate-y-px disabled:opacity-60",
          className,
        )}
      >
        {isPending ? (
          <Loader2 className="size-5 animate-spin" aria-hidden />
        ) : (
          <Check className="size-5" strokeWidth={3} aria-hidden />
        )}
        {isPending ? "Confirming…" : "Confirm order"}
      </button>

      {needsCheck && (
        <ConfirmDialog
          open={asking}
          onOpenChange={setAsking}
          title="Did the InstaPay transfer arrive?"
          confirmLabel="Yes, it arrived — confirm"
          cancelLabel="Not yet"
          pending={isPending}
          onConfirm={() =>
            confirmOrder(order.orderNumber, { onSuccess: () => setAsking(false) })
          }
        >
          <p className="font-heading text-3xl text-foreground">
            <T>{formatPrice(order.total)}</T>
          </p>
          <p className="mt-1 text-sm">
            <span data-i18n-ignore className="font-semibold text-foreground">
              {customerName(order)}
            </span>
            {order.paymentReference && (
              <>
                <span aria-hidden> · </span>
                <span>Reference</span>{" "}
                <span data-i18n-ignore dir="ltr" className="font-bold text-foreground">
                  {order.paymentReference}
                </span>
              </>
            )}
          </p>
          <p className="mt-4 rounded-xl bg-warning-soft px-3 py-2.5 text-sm font-semibold text-warning-strong">
            Check your bank app first. Confirming marks this order as paid.
          </p>
        </ConfirmDialog>
      )}
    </>
  );
}
