"use client";

import { useQuery } from "@tanstack/react-query";
import { getProducts } from "@/lib/api/products";
import { DishCard } from "@/components/menu/dish-card";

export function MenuSearchResults({ q }: { q: string }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["menu", "search", q],
    queryFn: () => getProducts({ q, limit: 50 }),
  });

  if (isLoading) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-36 animate-pulse rounded-[1.5rem] bg-muted" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-[1.5rem] border border-border bg-card p-8 text-center">
        <h2 className="font-heading text-xl font-black">The menu could not be searched</h2>
        <p className="mt-2 text-sm text-muted-foreground">Please try again in a moment.</p>
      </div>
    );
  }

  if (!data?.items.length) {
    return (
      <div className="rounded-[1.5rem] border border-border bg-card p-8 text-center">
        <p className="font-bold">Nothing on the menu matches “{q}”.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Try a dish name, or browse the full menu.
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-5 text-sm font-bold text-muted-foreground">
        {data.pagination.total} {data.pagination.total === 1 ? "dish" : "dishes"}
      </p>
      <div className="grid gap-3 md:grid-cols-2">
        {data.items.map((dish) => (
          <DishCard key={dish._id} product={dish} />
        ))}
      </div>
    </div>
  );
}
