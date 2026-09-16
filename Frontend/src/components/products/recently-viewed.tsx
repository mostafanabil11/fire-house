"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { getRecentlyViewed } from "@/lib/recently-viewed";
import { useHydrated } from "@/hooks/use-hydrated";

export function RecentlyViewed({ excludeId }: { excludeId?: string }) {
  const hydrated = useHydrated();
  const items = hydrated ? getRecentlyViewed().filter((entry) => entry._id !== excludeId) : [];

  if (items.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-(--spacing-container-max) border-t border-border px-margin-mobile py-stack-lg md:px-margin-desktop">
      <h2 className="mb-8 font-heading text-headline-sm font-bold text-foreground">Recently Viewed</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {items.map((item) => (
          <Link key={item._id} href={`/menu/${item.slug}`} className="group">
            <div className="relative mb-3 aspect-3/4 overflow-hidden rounded-2xl bg-muted">
              {item.image && (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  loading="eager"
                  className="object-cover transition-opacity group-hover:opacity-80"
                  sizes="(min-width: 768px) 25vw, 50vw"
                />
              )}
            </div>
            <p className="text-[13px] text-foreground">{item.name}</p>
            <p className="text-[13px] text-muted-foreground">{formatPrice(item.discountPrice ?? item.price)}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
