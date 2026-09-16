"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/format";
import { T } from "@/i18n/language-provider";
export function BrowseCartBar() {
  const path = usePathname();
  const { cart, itemCount, isLoading, isError } = useCart();
  if (!["/", "/menu", "/search"].includes(path) || !itemCount || isLoading || isError) return null;
  return <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 p-3 backdrop-blur-lg md:hidden">
    <Link href="/cart" className="action-primary flex w-full justify-between px-4"><span className="flex items-center gap-2"><ShoppingBag className="size-4" aria-hidden />{itemCount}<span className="ms-1"><T>View your order</T></span></span><span className="flex items-center gap-2"><T>{formatPrice(cart.subtotal)}</T><ArrowRight className="size-4" aria-hidden /></span></Link>
  </div>;
}
