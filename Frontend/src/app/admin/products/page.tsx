"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Plus, Search, UtensilsCrossed } from "lucide-react";
import { getAdminProducts } from "@/lib/api/products";
import { formatPrice } from "@/lib/format";
import { AdminPageHeader } from "@/components/admin/ui/page-header";
import { StatusPill } from "@/components/admin/ui/status-pill";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { Pagination } from "@/components/admin/ui/pagination";
import { T } from "@/i18n/language-provider";

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products", page, q],
    queryFn: () => getAdminProducts({ page, limit: 20, q: q.trim() || undefined }),
  });

  return (
    <div className="grid gap-5">
      <AdminPageHeader title="Menu" description="Every dish customers can order.">
        <Link href="/admin/products/new" className="action-primary min-h-11 rounded-xl px-4">
          <Plus className="size-4" aria-hidden />
          New dish
        </Link>
      </AdminPageHeader>

      <label className="flex min-h-12 items-center gap-2 rounded-2xl border border-border bg-card px-4 sm:max-w-md">
        <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Search dishes…"
          aria-label="Search dishes"
          className="min-h-11 w-full min-w-0 bg-transparent text-base outline-none"
        />
      </label>

      {isLoading || !data ? (
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
      ) : data.items.length === 0 ? (
        <EmptyState icon={<UtensilsCrossed aria-hidden />} title="No dishes found." />
      ) : (
        <>
          <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {data.items.map((product) => {
              const section = typeof product.category === "object" ? product.category?.name : null;
              return (
                <li key={product._id}>
                  <Link
                    href={`/admin/products/${product._id}`}
                    className="flex min-h-18 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60 sm:gap-4 sm:px-5"
                  >
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <UtensilsCrossed className="m-auto mt-3.5 size-5 text-muted-foreground" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-bold">
                        <T>{product.name}</T>
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2">
                        {section && (
                          <span className="text-sm text-muted-foreground">
                            <T>{section}</T>
                          </span>
                        )}
                        {!product.isActive && <StatusPill>Hidden</StatusPill>}
                        {product.isActive && !product.isAvailable && (
                          <StatusPill tone="warning">Sold out</StatusPill>
                        )}
                      </div>
                    </div>
                    <p className="shrink-0 text-base font-extrabold tabular-nums">
                      <T>{formatPrice(product.discountPrice ?? product.price)}</T>
                    </p>
                    <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>

          <Pagination page={data.pagination.page} pages={data.pagination.pages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
