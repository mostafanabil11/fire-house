"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Plus, ArrowUpRight, Loader2, UtensilsCrossed } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/format";
import { errorMessage } from "@/lib/api/error-message";
import { T, useLanguage } from "@/i18n/language-provider";
import type { Product } from "@/types/product";

export function DishCard({ product, featured = false }: { product: Product; featured?: boolean }) {
  const { addItem, isLoading } = useCart();
  const { t } = useLanguage();
  const [adding, setAdding] = useState(false);
  const soldOut = !product.isAvailable || (product.trackInventory && (product.stockQuantity ?? 0) <= 0);
  const custom = product.variants.length > 0 || product.modifierGroups.length > 0;
  async function quickAdd() {
    setAdding(true);
    try {
      await addItem({productId:product._id,variantId:null,modifierOptionIds:[],note:null,quantity:1}, {slug:product.slug,name:product.name,image:product.images[0] ?? "",price:product.discountPrice ?? product.price});
      toast.success(t("Added to your order"), {description:t(product.name)});
    } catch(error) { toast.error(t(errorMessage(error,"Could not add this item. Please try again."))); }
    finally { setAdding(false); }
  }
  return <article className={`group relative flex overflow-hidden rounded-2xl border border-border/80 bg-card transition-shadow hover:shadow-md hover:shadow-black/5 ${featured ? "flex-col" : "gap-3 p-3 sm:gap-4 sm:p-4"} ${soldOut ? "opacity-65" : ""}`}>
    <Link href={`/menu/${product.slug}`} tabIndex={-1} aria-hidden className={`relative block shrink-0 overflow-hidden bg-muted ${featured ? "aspect-[4/3]" : "size-24 rounded-xl sm:size-32"}`}>
      {product.images[0] ? <Image src={product.images[0]} alt="" fill sizes={featured ? "(min-width:1024px) 400px, (min-width:640px) 50vw, 100vw" : "(min-width:640px) 128px, 96px"} className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" /> : <span className="grid size-full place-items-center"><UtensilsCrossed className="text-primary/50" /></span>}
      {featured && product.isBestSeller && <span className="absolute start-4 top-4 rounded-full bg-background/95 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider"><T>Popular</T></span>}
    </Link>
    <div className={`flex min-w-0 flex-1 flex-col ${featured ? "p-5" : "py-0.5"}`}>
      {!featured && product.isBestSeller && <p className="mb-1 text-[10px] font-extrabold tracking-wider text-primary uppercase"><T>Popular</T></p>}
      <h3 className="font-heading text-[15px] leading-snug sm:text-lg"><Link href={`/menu/${product.slug}`} className="hover:text-primary"><T>{product.name}</T></Link></h3>
      {product.description && <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground sm:text-sm sm:leading-6"><T>{product.description}</T></p>}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-3 pt-4">
        <p className="text-sm font-extrabold sm:text-base"><T>{formatPrice(product.discountPrice ?? product.price)}</T>{product.discountPrice !== null && <span className="ms-2 text-xs font-medium text-muted-foreground line-through"><T>{formatPrice(product.price)}</T></span>}</p>
        {soldOut ? <span className="rounded-full bg-muted px-3 py-2 text-xs font-bold"><T>Sold out</T></span> : custom ? <Link href={`/menu/${product.slug}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-secondary/70 px-3 text-xs font-extrabold text-primary hover:bg-secondary"><T>Customize</T><ArrowUpRight className="size-3.5" aria-hidden /></Link> : <button onClick={quickAdd} disabled={adding || isLoading} aria-label={`${t("Add to order")}: ${t(product.name)}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-extrabold text-white disabled:opacity-50">{adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" aria-hidden />}<T>Add</T></button>}
      </div>
    </div>
  </article>;
}
