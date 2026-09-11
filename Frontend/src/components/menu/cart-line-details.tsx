import type { ResolvedCartLine } from "@/types/cart";

// The customizations that make one line different from another: the size, the
// add-ons, and the kitchen note. Without these, two lines of the same dish
// look like a duplicate rather than two deliberately different orders.
export function CartLineDetails({
  line,
  className = "",
}: {
  line: Pick<ResolvedCartLine, "variant" | "modifiers" | "note" | "available" | "customizationError">;
  className?: string;
}) {
  const parts = [
    ...(line.variant ? [line.variant.name] : []),
    ...line.modifiers.map((modifier) => modifier.name),
  ];

  if (parts.length === 0 && !line.note && line.available) return null;

  return (
    <div className={`mt-1 space-y-1 ${className}`}>
      {parts.length > 0 && (
        <p className="text-[0.8rem] leading-5 text-muted-foreground">{parts.join(" · ")}</p>
      )}
      {line.note && (
        <p className="text-[0.8rem] leading-5 text-muted-foreground italic">“{line.note}”</p>
      )}
      {!line.available && (
        <p className="text-xs font-black text-destructive uppercase">
          {line.customizationError ?? "No longer available"}
        </p>
      )}
    </div>
  );
}
