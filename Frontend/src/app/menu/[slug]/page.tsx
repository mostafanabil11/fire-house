import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { getProductBySlugServer, getAllProductSlugsServer } from "@/lib/api/products";
import { getStoreSettings } from "@/lib/api/settings";
import { DishDetailView } from "@/components/menu/dish-detail-view";
import { formatPrice } from "@/lib/format";
import { RESTAURANT } from "@/config/restaurant";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const slugs = await getAllProductSlugsServer();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const dish = await getProductBySlugServer(slug);

  if (!dish) {
    return { title: `Dish not found — ${RESTAURANT.name}` };
  }

  const price = formatPrice(dish.discountPrice ?? dish.price);
  const description =
    dish.description ?? `${dish.name} — ${price}. Customize it and order from ${RESTAURANT.name}.`;

  return {
    title: `${dish.name} — ${RESTAURANT.name}`,
    description,
    openGraph: {
      title: `${dish.name} — ${RESTAURANT.name}`,
      description,
      images: dish.images[0] ? [{ url: dish.images[0] }] : undefined,
      type: "website",
    },
  };
}

export default async function DishPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [dish, settings] = await Promise.all([getProductBySlugServer(slug), getStoreSettings()]);

  if (!dish) {
    notFound();
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3101";
  const priceMinorUnits = dish.discountPrice ?? dish.price;
  const inStock = dish.isAvailable && (!dish.trackInventory || (dish.stockQuantity ?? 0) > 0);

  // Menu structured data — this is what lets a search result show the dish
  // price and whether it is currently being served.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MenuItem",
    name: dish.name,
    image: dish.images,
    description: dish.description ?? dish.name,
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/menu/${dish.slug}`,
      priceCurrency: settings.currency,
      price: (priceMinorUnits / 100).toFixed(2),
      availability: inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(dish.dietaryTags.length > 0 ? { suitableForDiet: dish.dietaryTags } : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto w-full max-w-5xl px-4 pt-5 sm:px-6">
        <Link
          href="/menu"
          className="inline-flex min-h-11 items-center gap-1 text-sm font-bold text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Back to the menu
        </Link>
      </div>
      <DishDetailView product={dish} />
    </>
  );
}
