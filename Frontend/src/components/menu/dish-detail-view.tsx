"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Clock3, Minus, Plus, UtensilsCrossed } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/format";
import { recordRecentlyViewed } from "@/lib/recently-viewed";
import type { MenuModifierGroup, ProductDetail } from "@/types/product";

const DIETARY_LABELS: Record<string, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  spicy: "Spicy",
  gluten_free: "Gluten free",
  halal: "Halal",
};

function dietaryLabel(tag: string) {
  return DIETARY_LABELS[tag] ?? tag.replace(/[_-]/g, " ");
}

// A group the customer must answer before the dish can be added. The backend
// enforces the same rule; checking here just avoids a pointless round trip.
function isRequired(group: MenuModifierGroup) {
  return group.minSelections > 0;
}

export function DishDetailView({ product }: { product: ProductDetail }) {
  const { addItem } = useCart();

  const availableVariants = useMemo(
    () => product.variants.filter((variant) => variant.isAvailable),
    [product.variants],
  );

  const [variantId, setVariantId] = useState<string | null>(() => {
    if (availableVariants.length === 0) return null;
    return (availableVariants.find((v) => v.isDefault) ?? availableVariants[0]).id;
  });
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [note, setNote] = useState("");
  const [quantity, setQuantity] = useState(1);

  const { _id, name, slug, images, price, discountPrice } = product;
  useEffect(() => {
    recordRecentlyViewed({ _id, name, slug, image: images[0] ?? null, price, discountPrice });
  }, [_id, name, slug, images, price, discountPrice]);

  const selectedVariant = availableVariants.find((v) => v.id === variantId) ?? null;

  const chosenOptionIds = useMemo(() => Object.values(selectedOptions).flat(), [selectedOptions]);

  // The same arithmetic the server will redo: base price, then the variant,
  // then every add-on. Shown live so nothing is a surprise at the cart.
  const unitPrice = useMemo(() => {
    const base = product.discountPrice ?? product.price;
    const variantAdjustment = selectedVariant?.priceAdjustment ?? 0;
    const modifierAdjustment = product.modifierGroups.reduce((sum, group) => {
      const picked = selectedOptions[group.id] ?? [];
      return (
        sum +
        group.options
          .filter((option) => picked.includes(option.id))
          .reduce((groupSum, option) => groupSum + option.priceAdjustment, 0)
      );
    }, 0);
    return base + variantAdjustment + modifierAdjustment;
  }, [product, selectedVariant, selectedOptions]);

  const unmetGroup = product.modifierGroups.find(
    (group) => (selectedOptions[group.id] ?? []).length < group.minSelections,
  );

  // Two ways a dish can be impossible to order even though it is still listed:
  // every variant is unavailable, or a required group has nothing left to pick
  // from. The server rejects both; saying so here beats letting the customer
  // configure a dish and then get an error on "Add to order".
  const noVariantLeft = product.variants.length > 0 && availableVariants.length === 0;
  const noRequiredOptionLeft = product.modifierGroups.some(
    (group) =>
      group.minSelections > 0 &&
      group.options.filter((option) => option.isAvailable).length < group.minSelections,
  );
  const soldOut =
    !product.isAvailable ||
    (product.trackInventory && (product.stockQuantity ?? 0) <= 0) ||
    noVariantLeft ||
    noRequiredOptionLeft;

  const canAdd = !soldOut && !unmetGroup;

  function toggleOption(group: MenuModifierGroup, optionId: string) {
    setSelectedOptions((current) => {
      const picked = current[group.id] ?? [];
      const isPicked = picked.includes(optionId);

      // A single-choice group behaves like a radio: picking another option
      // replaces the first rather than refusing the tap.
      if (group.maxSelections === 1) {
        // Tapping the chosen option again clears it, but only where the group
        // is optional — a required group must keep an answer.
        return { ...current, [group.id]: isPicked && group.minSelections === 0 ? [] : [optionId] };
      }

      if (isPicked) {
        return { ...current, [group.id]: picked.filter((id) => id !== optionId) };
      }
      if (picked.length >= group.maxSelections) {
        toast.error(`You can choose up to ${group.maxSelections} from ${group.name}`);
        return current;
      }
      return { ...current, [group.id]: [...picked, optionId] };
    });
  }

  function handleAddToCart() {
    if (soldOut) {
      toast.error("This dish is not available right now");
      return;
    }
    if (unmetGroup) {
      toast.error(`Please choose from ${unmetGroup.name}`);
      return;
    }

    addItem(
      {
        productId: product._id,
        variantId: selectedVariant?.id ?? null,
        modifierOptionIds: chosenOptionIds,
        note: note.trim() || null,
        quantity,
      },
      {
        slug: product.slug,
        name: product.name,
        image: product.images[0] ?? "",
        price: unitPrice,
      },
    );

    toast.success(`${quantity} × ${product.name} added to your order`);
    setQuantity(1);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pt-4 pb-32 sm:px-6 lg:pb-16">
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-muted lg:sticky lg:top-28 lg:self-start">
          {product.images[0] ? (
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              priority
              className="object-cover"
              sizes="(min-width: 1024px) 480px, 100vw"
            />
          ) : (
            <div className="grid size-full place-items-center text-primary/40">
              <UtensilsCrossed className="size-16" strokeWidth={1.25} aria-hidden />
            </div>
          )}
        </div>

        <div>
          <h1 className="font-heading text-3xl font-black tracking-[-0.035em] sm:text-4xl">
            {product.name}
          </h1>

          {product.description && (
            <p className="mt-3 text-base leading-7 text-muted-foreground">{product.description}</p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {product.dietaryTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground capitalize"
              >
                {dietaryLabel(tag)}
              </span>
            ))}
            {product.preparationTimeMinutes && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-bold text-muted-foreground">
                <Clock3 className="size-3.5" aria-hidden />
                {product.preparationTimeMinutes} min
              </span>
            )}
          </div>

          <p className="mt-5 font-heading text-2xl font-black">
            {formatPrice(product.discountPrice ?? product.price)}
            {product.discountPrice && (
              <span className="ml-2 align-middle text-base font-bold text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </p>

          {soldOut && (
            <p className="mt-5 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
              This dish is off the menu right now.
            </p>
          )}

          {availableVariants.length > 0 && (
            <fieldset className="mt-8">
              <legend className="text-sm font-black tracking-[0.1em] uppercase">
                Choose a size
                <span className="ml-2 text-xs font-bold tracking-normal text-primary normal-case">
                  Required
                </span>
              </legend>
              <div className="mt-3 grid gap-2">
                {availableVariants.map((variant) => (
                  <label
                    key={variant.id}
                    className={`flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-bold transition-colors ${
                      variantId === variant.id
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card hover:border-foreground/30"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="variant"
                        className="sr-only"
                        checked={variantId === variant.id}
                        onChange={() => setVariantId(variant.id)}
                      />
                      {variant.name}
                    </span>
                    {variant.priceAdjustment > 0 && (
                      <span>+{formatPrice(variant.priceAdjustment)}</span>
                    )}
                  </label>
                ))}
              </div>
            </fieldset>
          )}

          {product.modifierGroups.map((group) => {
            const picked = selectedOptions[group.id] ?? [];
            const single = group.maxSelections === 1;
            return (
              <fieldset key={group.id} className="mt-8">
                <legend className="text-sm font-black tracking-[0.1em] uppercase">
                  {group.name}
                  <span
                    className={`ml-2 text-xs font-bold tracking-normal normal-case ${
                      isRequired(group) ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    {isRequired(group)
                      ? "Required"
                      : single
                        ? "Optional"
                        : `Optional · up to ${group.maxSelections}`}
                  </span>
                </legend>
                <div className="mt-3 grid gap-2">
                  {group.options.map((option) => {
                    const checked = picked.includes(option.id);
                    return (
                      <label
                        key={option.id}
                        className={`flex min-h-12 items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition-colors ${
                          option.isAvailable
                            ? "cursor-pointer border-border bg-card hover:border-foreground/30"
                            : "cursor-not-allowed border-border/60 bg-muted/50 text-muted-foreground/60"
                        } ${checked ? "border-foreground ring-2 ring-foreground/15" : ""}`}
                      >
                        <span className="flex items-center gap-3">
                          <input
                            type={single ? "radio" : "checkbox"}
                            name={single ? `group-${group.id}` : undefined}
                            className="size-5 shrink-0 accent-[var(--primary)]"
                            checked={checked}
                            disabled={!option.isAvailable}
                            onChange={() => toggleOption(group, option.id)}
                          />
                          <span>{option.name}</span>
                        </span>
                        {option.priceAdjustment > 0 && (
                          <span className="shrink-0 font-bold">
                            +{formatPrice(option.priceAdjustment)}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          <div className="mt-8">
            <label htmlFor="dish-note" className="text-sm font-black tracking-[0.1em] uppercase">
              Anything else?
              <span className="ml-2 text-xs font-bold tracking-normal text-muted-foreground normal-case">
                Optional
              </span>
            </label>
            <textarea
              id="dish-note"
              value={note}
              onChange={(event) => setNote(event.target.value.slice(0, 300))}
              rows={3}
              placeholder="No pickles, extra napkins…"
              className="mt-3 w-full rounded-2xl border border-border bg-card p-4 text-base outline-none focus:border-foreground"
            />
          </div>

          {product.allergens.length > 0 && (
            <p className="mt-6 text-sm text-muted-foreground">
              <span className="font-bold text-foreground">Allergens:</span>{" "}
              {product.allergens.join(", ")}
            </p>
          )}
        </div>
      </div>

      {/* Pinned on phones so the running total and the action stay reachable
          without scrolling back up past a long list of add-ons. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background/95 p-4 backdrop-blur-md lg:static lg:mt-10 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-border bg-card px-1 py-1">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="grid size-11 place-items-center rounded-full transition-colors hover:bg-muted disabled:opacity-30"
            >
              <Minus className="size-4" strokeWidth={2.5} aria-hidden />
            </button>
            <span aria-live="polite" className="min-w-6 text-center text-base font-black">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(50, q + 1))}
              aria-label="Increase quantity"
              className="grid size-11 place-items-center rounded-full transition-colors hover:bg-muted"
            >
              <Plus className="size-4" strokeWidth={2.5} aria-hidden />
            </button>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canAdd}
            className="flex min-h-13 flex-1 items-center justify-between gap-3 rounded-full bg-primary px-6 text-sm font-black text-primary-foreground transition-transform enabled:hover:-translate-y-0.5 disabled:opacity-45"
          >
            <span>
              {soldOut ? "Unavailable" : unmetGroup ? `Choose ${unmetGroup.name}` : "Add to order"}
            </span>
            <span>{formatPrice(unitPrice * quantity)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
