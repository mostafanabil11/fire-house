import Image from "next/image";
import { formatPrice } from "@/lib/format";
import type { OrderItem } from "@/types/order";

// What the customer chose, beyond the dish itself: the variant, then every
// add-on, then anything the older catalog put on the line (colour/size). The
// add-ons are the half of the order the kitchen actually has to act on, so
// they belong on the receipt rather than only in the cart they were picked in.
function choiceLabels(item: OrderItem): string[] {
  return [
    item.variant?.name,
    ...item.modifiers.map((modifier) => modifier.name),
    item.color,
    item.size,
  ].filter((value): value is string => Boolean(value));
}

/**
 * The ordered dishes as a receipt. Shared by the confirmation page and the
 * order views behind it so a customer sees the same order in the same shape
 * wherever they open it.
 */
export function OrderItems({ items }: { items: OrderItem[] }) {
  return (
    <ul className="divide-y divide-border">
      {items.map((item, index) => {
        const choices = choiceLabels(item);

        return (
          <li key={`${item.product}-${item.variant?.id ?? ""}-${index}`} className="flex gap-4 py-4 first:pt-0 last:pb-0">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-[1.1rem] bg-muted sm:size-20">
              {item.image && (
                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
              )}
              {/* The count rides on the image so the eye picks up "2 of these"
                  in the same glance as the dish itself. */}
              <span className="absolute right-0 bottom-0 grid min-w-6 place-items-center rounded-tl-lg bg-foreground px-1.5 py-0.5 text-[11px] font-black text-background">
                {item.quantity}
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="text-[15px] font-black tracking-tight text-foreground">{item.name}</p>
                <p className="shrink-0 text-[15px] font-black text-foreground">
                  {formatPrice(item.lineTotal)}
                </p>
              </div>

              {choices.length > 0 && (
                <ul className="mt-1.5 flex flex-wrap gap-1.5">
                  {choices.map((choice) => (
                    <li
                      key={choice}
                      className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold text-muted-foreground"
                    >
                      {choice}
                    </li>
                  ))}
                </ul>
              )}

              {item.note && (
                <p className="mt-2 border-l-2 border-primary pl-2.5 text-xs text-muted-foreground italic">
                  “{item.note}”
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
