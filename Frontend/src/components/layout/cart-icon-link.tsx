"use client";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useLanguage } from "@/i18n/language-provider";
export function CartIconLink({ className, showLabel }: { className?: string; showLabel?: boolean }) {
  const { itemCount, isLoading } = useCart();
  const { t } = useLanguage();
  return <Link href="/cart" className={className} aria-label={t("Your order") + (itemCount ? ` · ${itemCount}` : "")}>
    <ShoppingBag className="size-5" strokeWidth={1.8} aria-hidden />
    {showLabel && <span className="hidden md:inline">{t("Your order")}</span>}
    {!isLoading && itemCount > 0 && <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] text-white">{itemCount}</span>}
  </Link>;
}
