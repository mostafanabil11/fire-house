import Image from "next/image";
import Link from "next/link";
import { Plus, UtensilsCrossed } from "lucide-react";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/types/product";

// One row of the menu. The whole card is the link — on a phone the tap target
// is the card, not just the small round button, which is also there so the
// affordance is obvious.
export function DishCard({ product }: { product: Product }) {
  const soldOut =
    !product.isAvailable || (product.trackInventory && (product.stockQuantity ?? 0) <= 0);

  return (
    <Link
      href={`/menu/${product.slug}`}
      aria-disabled={soldOut}
      className={`group relative flex gap-4 overflow-hidden rounded-[1.5rem] border border-border bg-card p-3 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg hover:shadow-black/5 ${
        soldOut ? "opacity-60" : ""
      }`}
    >
      <div className="relative size-28 shrink-0 overflow-hidden rounded-[1.1rem] bg-muted sm:size-32">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(min-width: 640px) 128px, 112px"
          />
        ) : (
          <div className="grid size-full place-items-center text-primary/40">
            <UtensilsCrossed className="size-7" strokeWidth={1.5} aria-hidden />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col py-1 pr-1">
        {product.isBestSeller && (
          <p className="mb-1 text-[0.7rem] font-black tracking-[0.11em] text-primary uppercase">
            Popular
          </p>
        )}
        <h3 className="font-heading text-base font-black tracking-tight sm:text-lg">
          {product.name}
        </h3>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {product.description}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          <p className="font-black">
            {formatPrice(product.discountPrice ?? product.price)}
            {product.discountPrice && (
              <span className="ml-2 text-sm font-bold text-muted-foreground line-through">
                {formatPrice(product.price)}
              </span>
            )}
          </p>
          <span
            aria-hidden
            className={`grid size-10 shrink-0 place-items-center rounded-full transition-transform ${
              soldOut
                ? "bg-muted text-muted-foreground"
                : "bg-primary text-primary-foreground group-hover:scale-105"
            }`}
          >
            <Plus className="size-5" strokeWidth={2.5} />
          </span>
        </div>
        {soldOut && (
          <p className="mt-2 text-xs font-black text-destructive uppercase">Sold out</p>
        )}
      </div>
    </Link>
  );
}
