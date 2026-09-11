import type { Metadata } from "next";
import { getMenuServer } from "@/lib/api/products";
import { getCategoryTreeServer } from "@/lib/api/categories";
import { DishCard } from "@/components/menu/dish-card";
import { MenuSectionNav } from "@/components/menu/menu-section-nav";
import { RESTAURANT } from "@/config/restaurant";
import type { Product } from "@/types/product";

export const metadata: Metadata = {
  title: `Menu — ${RESTAURANT.name}`,
  description: `Browse the full ${RESTAURANT.name} menu, customize your dish, and order directly from the kitchen.`,
};

function categoryIdOf(product: Product): string | null {
  const { category } = product;
  return typeof category === "string" ? category : (category?._id ?? null);
}

export default async function MenuPage() {
  const [categories, dishes] = await Promise.all([getCategoryTreeServer(), getMenuServer()]);

  // Sections follow the owner's category order; anything whose section was
  // deleted or hidden still gets shown rather than silently disappearing
  // from the menu.
  const sections = categories
    .map((category) => ({
      id: category.slug,
      name: category.name,
      items: dishes.filter((dish) => categoryIdOf(dish) === category._id),
    }))
    .filter((section) => section.items.length > 0);

  const placed = new Set(sections.flatMap((section) => section.items.map((item) => item._id)));
  const unsectioned = dishes.filter((dish) => !placed.has(dish._id));
  if (unsectioned.length > 0) {
    sections.push({ id: "more", name: "More", items: unsectioned });
  }

  return (
    <div className="px-4 pb-16 sm:px-6 sm:pb-24">
      <div className="mx-auto max-w-7xl pt-8 sm:pt-12">
        <p className="text-sm font-black tracking-[0.16em] text-primary uppercase">
          {RESTAURANT.orderStatus}
        </p>
        <h1 className="mt-2 font-heading text-4xl font-black tracking-[-0.045em] sm:text-5xl">
          Our menu
        </h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-muted-foreground">
          Pick a dish, choose your size and add-ons, and order straight from our kitchen.
          Delivery in about {RESTAURANT.estimatedDelivery}.
        </p>
      </div>

      <div className="mx-auto mt-6 max-w-7xl">
        <MenuSectionNav
          sections={sections.map((section) => ({
            id: section.id,
            name: section.name,
            count: section.items.length,
          }))}
        />
      </div>

      {sections.length === 0 ? (
        <div className="mx-auto mt-10 max-w-7xl rounded-[1.5rem] border border-border bg-card p-8 text-center">
          <h2 className="font-heading text-xl font-black">The menu is not available right now</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Please refresh in a moment, or call us to place your order.
          </p>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl">
          {sections.map((section) => (
            <section key={section.id} className="pt-10 sm:pt-14">
              {/* scroll-mt clears the sticky header *and* the section chips
                  above, so an anchored heading is never hidden behind them. */}
              <h2
                id={section.id}
                className="scroll-mt-36 font-heading text-2xl font-black tracking-[-0.03em] sm:text-3xl lg:scroll-mt-44"
              >
                {section.name}
              </h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {section.items.map((dish) => (
                  <DishCard key={dish._id} product={dish} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
