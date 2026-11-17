import { Fragment } from "react";
import { StickyNote } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { T } from "@/i18n/language-provider";
import { cn } from "@/lib/utils";
import type { OrderItem } from "@/types/order";

/**
 * What the kitchen has to make, read the same way on the board and on the
 * order page. Add-ons and notes wrap onto as many lines as they need and are
 * never cut short: they are the difference between a correct order and a
 * remake.
 */
export function OrderItemLines({
  items,
  showPrices = false,
}: {
  items: OrderItem[];
  showPrices?: boolean;
}) {
  return (
    <ul className="divide-y divide-border">
      {items.map((item, index) => {
        const details = [
          ...(item.variant ? [item.variant.name] : []),
          ...item.modifiers.map((modifier) => modifier.name),
        ];
        return (
          <li key={`${item.product}-${index}`} className="py-2.5 first:pt-0 last:pb-0">
            <div className="flex items-start gap-3">
              {/* A quantity over one stands out: a missed double is the most
                  common kitchen mistake. */}
              <span
                className={cn(
                  "grid h-7 min-w-9 shrink-0 place-items-center rounded-lg px-1.5 text-sm font-extrabold tabular-nums",
                  item.quantity > 1 ? "bg-foreground text-background" : "bg-muted text-foreground",
                )}
              >
                {`${item.quantity}×`}
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-base leading-snug font-bold">
                    <T>{item.name}</T>
                  </p>
                  {showPrices && (
                    <p className="shrink-0 text-sm font-bold tabular-nums">
                      <T>{formatPrice(item.lineTotal)}</T>
                    </p>
                  )}
                </div>
                {details.length > 0 && (
                  <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
                    {details.map((detail, detailIndex) => (
                      <Fragment key={detailIndex}>
                        {detailIndex > 0 && " · "}
                        <T>{detail}</T>
                      </Fragment>
                    ))}
                  </p>
                )}
                {item.note && (
                  <p className="mt-2 flex items-start gap-2 rounded-xl bg-warning-soft px-3 py-2 text-sm font-semibold text-warning-strong">
                    <StickyNote className="mt-0.5 size-4 shrink-0" strokeWidth={2.25} aria-hidden />
                    <span data-i18n-ignore className="min-w-0 break-words">
                      {item.note}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
