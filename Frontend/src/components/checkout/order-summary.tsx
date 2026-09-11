import Image from "next/image";
import { formatPrice } from "@/lib/format";
import { CartLineDetails } from "@/components/menu/cart-line-details";
import type { CartLine } from "@/types/cart";

export function OrderSummary({
  items,
  subtotal,
  shippingCost,
  discountAmount = 0,
  couponCode = null,
  total,
}: {
  items: CartLine[];
  subtotal: number;
  shippingCost: number | null;
  discountAmount?: number;
  couponCode?: string | null;
  total: number | null;
}) {
  return (
    <div>
      <div className="space-y-5">
        {items.map((item) => (
          <div key={item.key} className="flex items-start gap-4">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
              {item.image && <Image src={item.image} alt={item.name ?? ""} fill className="object-cover" sizes="64px" />}
              <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-full bg-foreground text-[10px] font-semibold text-background">
                {item.quantity}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-bold text-foreground">{item.name}</p>
              <CartLineDetails line={item} className="mt-0.5" />
            </div>
            <p className="text-[13px] text-foreground">{formatPrice(item.lineTotal)}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 space-y-3 border-t border-border pt-6 text-[13px]">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="text-foreground">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Delivery fee</span>
          <span className="text-foreground">
            {shippingCost === null ? "—" : shippingCost === 0 ? "Free" : formatPrice(shippingCost)}
          </span>
        </div>
        {discountAmount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Discount{couponCode ? ` (${couponCode})` : ""}</span>
            <span className="text-foreground">−{formatPrice(discountAmount)}</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-border pt-3 text-[15px] font-semibold">
          <span className="text-foreground">Total</span>
          <span className="text-foreground">{total === null ? "—" : formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}
