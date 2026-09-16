"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, UtensilsCrossed, X } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { useAppliedCoupon } from "@/hooks/use-applied-coupon";
import { formatPrice } from "@/lib/format";
import { CartChangedBanner } from "@/components/products/cart-changed-banner";
import { CouponField } from "@/components/checkout/coupon-field";
import { CartLineDetails } from "@/components/menu/cart-line-details";
import { PageSkeleton, PageState } from "@/components/ui/page-state";

export default function CartPage() {
  const { cart, isLoading, isError, retry, isAuthenticated, setQuantity, removeItem } = useCart();
  const { coupon } = useAppliedCoupon();
  const items = cart.items;

  if (isError) return <div className="page-shell"><PageState title="We couldn't load your order" description="Your selections are saved. Please try again." onRetry={retry} /></div>;
  if (isLoading && items.length === 0) return <PageSkeleton />;

  if (!isLoading && items.length === 0) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center px-4 py-20 text-center sm:px-6">
        <div className="grid size-16 place-items-center rounded-full bg-muted text-muted-foreground">
          <UtensilsCrossed className="size-7" strokeWidth={1.5} aria-hidden />
        </div>
        <h1 className="mt-6 font-heading text-3xl font-black tracking-[-0.035em]">
          Your order is empty
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Browse the menu and pick something you feel like eating.
        </p>
        <Link
          href="/menu"
          className="mt-8 inline-flex min-h-12 items-center rounded-full bg-primary px-8 text-sm font-black text-primary-foreground transition-transform hover:-translate-y-0.5"
        >
          View the menu
        </Link>
      </div>
    );
  }

  const hasUnavailable = items.some((i) => !i.available);
  // Mirrors the backend's own checkout gate exactly (see OrdersService.checkout)
  // — hasChanges stays true until the stored quantity is corrected via
  // setQuantity below, so a clamped-but-still-"available" line still blocks
  // checkout rather than clicking through to a guaranteed 409.
  const canCheckout = !isLoading && items.length > 0 && !hasUnavailable && !cart.hasChanges;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-heading text-3xl font-black tracking-[-0.04em] sm:text-4xl">Your order</h1>

      <div className="mt-6">
        <CartChangedBanner items={items} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ul className="grid gap-3">
            {items.map((item) => (
              <li
                key={item.key}
                className={`flex gap-4 rounded-[1.5rem] border border-border bg-card p-3 ${
                  !item.available ? "opacity-60" : ""
                }`}
              >
                <Link
                  href={item.slug ? `/menu/${item.slug}` : "/menu"}
                  className="relative size-24 shrink-0 overflow-hidden rounded-[1.1rem] bg-muted sm:size-28"
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name ?? ""}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  ) : (
                    <span className="grid size-full place-items-center text-primary/40">
                      <UtensilsCrossed className="size-6" strokeWidth={1.5} aria-hidden />
                    </span>
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={item.slug ? `/menu/${item.slug}` : "/menu"}>
                        <h2 className="font-heading text-base font-black tracking-tight sm:text-lg">
                          {item.name ?? "Unavailable dish"}
                        </h2>
                      </Link>
                      <CartLineDetails line={item} />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      aria-label={`Remove ${item.name ?? "item"} from your order`}
                      className="-mt-1 -me-1 grid size-11 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <X className="size-4" strokeWidth={2} />
                    </button>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
                    <div className="flex items-center gap-1 rounded-full border border-border p-0.5">
                      <button
                        type="button"
                        onClick={() => setQuantity(item.key, item.quantity - 1)}
                        aria-label="Decrease quantity"
                        className="grid size-9 place-items-center rounded-full transition-colors hover:bg-muted"
                      >
                        <Minus className="size-3.5" strokeWidth={2.5} />
                      </button>
                      <span className="min-w-5 text-center text-sm font-black">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(item.key, item.quantity + 1)}
                        disabled={
                          !item.available ||
                          (item.availableStock !== null && item.quantity >= item.availableStock)
                        }
                        aria-label="Increase quantity"
                        className="grid size-9 place-items-center rounded-full transition-colors hover:bg-muted disabled:opacity-30"
                      >
                        <Plus className="size-3.5" strokeWidth={2.5} />
                      </button>
                    </div>
                    <p className="shrink-0 font-black">
                      {item.available ? formatPrice(item.lineTotal) : "—"}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="h-fit rounded-[1.5rem] border border-border bg-card p-6 lg:sticky lg:top-28">
          <h2 className="font-heading text-lg font-black">Order summary</h2>

          <div className="mt-5 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-bold">{formatPrice(cart.subtotal)}</span>
          </div>
          {coupon && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Discount ({coupon.code})</span>
              <span className="font-bold">
                {coupon.freeShipping ? "Free delivery" : `−${formatPrice(coupon.discountAmount)}`}
              </span>
            </div>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Delivery fee and total are confirmed at checkout.
          </p>

          {/* Shown to guests too — they can hold a coupon just as easily as a
              member. The per-person cap is checked against their email at
              checkout, which is the first point we know one. */}
          <div className="mt-5">
            <CouponField items={items} isAuthenticated={isAuthenticated} />
          </div>

          {/* One button for everyone. Checkout takes contact details inline, so
              there is nothing to sign in *for* — the option to do so lives on
              the checkout page itself, next to the email field. */}
          <Link
            href="/checkout"
            aria-disabled={!canCheckout}
            className={`mt-5 flex min-h-13 w-full items-center justify-center rounded-full text-sm font-black transition-transform ${
              canCheckout
                ? "bg-primary text-primary-foreground hover:-translate-y-0.5"
                : "pointer-events-none bg-primary/40 text-primary-foreground/70"
            }`}
          >
            Go to checkout
          </Link>

          <Link
            href="/menu"
            className="mt-3 flex min-h-11 w-full items-center justify-center text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
          >
            Add more items
          </Link>
        </div>
      </div>
    </div>
  );
}
