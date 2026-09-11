import { AlertTriangle } from "lucide-react";
import type { CartLine } from "@/types/cart";

const REASON_COPY: Record<string, string> = {
  out_of_stock: "has run out",
  unavailable: "is off the menu right now",
  inactive: "is no longer on the menu",
  not_found: "is no longer on the menu",
  invalid_product: "is no longer on the menu",
  invalid_customization: "has options that are no longer available",
};

// Shown wherever a resolved cart's hasChanges flag is true — the client's
// view of the order (what was in localStorage, or what was shown a moment
// ago) no longer matches what the server will actually charge. Never lets
// that discrepancy pass silently.
export function CartChangedBanner({ items }: { items: CartLine[] }) {
  const unavailable = items.filter((i) => !i.available);
  const clamped = items.filter((i) => i.available && i.quantity !== i.requestedQuantity);

  if (unavailable.length === 0 && clamped.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-[13px]">
      <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" strokeWidth={2} />
      <div className="space-y-1">
        <p className="font-black">Your order has changed</p>
        {unavailable.map((item) => (
          <p key={item.key} className="text-muted-foreground">
            {item.name ?? "A dish"}{" "}
            {item.customizationError ?? REASON_COPY[item.reason] ?? "is no longer on the menu"} and
            was removed.
          </p>
        ))}
        {clamped.map((item) => (
          <p key={`${item.key}-qty`} className="text-muted-foreground">
            Only {item.availableStock} of {item.name} {item.availableStock === 1 ? "is" : "are"}{" "}
            left — quantity updated.
          </p>
        ))}
      </div>
    </div>
  );
}
