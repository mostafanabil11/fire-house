"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { SearchX } from "lucide-react";
import { getAdminProduct, getStockMovements } from "@/lib/api/products";
import { ProductForm } from "@/components/admin/product-form";
import { AdminPageHeader } from "@/components/admin/ui/page-header";
import { AdminBackLink } from "@/components/admin/ui/back-link";
import { Panel } from "@/components/admin/ui/panel";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { T } from "@/i18n/language-provider";

export default function EditProductPage() {
  const params = useParams<{ id: string }>();

  const productQuery = useQuery({
    queryKey: ["admin", "products", params.id],
    queryFn: () => getAdminProduct(params.id),
    retry: false,
  });

  const movementsQuery = useQuery({
    queryKey: ["admin", "products", params.id, "movements"],
    queryFn: () => getStockMovements(params.id),
    enabled: !!productQuery.data,
  });

  return (
    <div className="grid gap-5">
      <div>
        <AdminBackLink href="/admin/products">Menu</AdminBackLink>
        <AdminPageHeader title={productQuery.data ? <T>{productQuery.data.name}</T> : "Edit dish"} />
      </div>

      {productQuery.isLoading ? (
        <div className="h-96 max-w-3xl animate-pulse rounded-2xl bg-muted" />
      ) : !productQuery.data ? (
        <EmptyState
          icon={<SearchX aria-hidden />}
          title="Dish not found."
          action={
            <Link href="/admin/products" className="action-primary">
              Back to the menu
            </Link>
          }
        />
      ) : (
        <>
          <ProductForm product={productQuery.data} />

          <Panel title="Stock history" className="max-w-3xl" flush>
            {!movementsQuery.data || movementsQuery.data.length === 0 ? (
              <p className="px-4 py-4 text-sm text-muted-foreground sm:px-5">
                No stock movements recorded yet.
              </p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {movementsQuery.data.map((m) => (
                  <li
                    key={m._id}
                    className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-3 sm:px-5"
                  >
                    <span className="text-muted-foreground">
                      {new Date(m.createdAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    <span>{`Size ${m.size}`}</span>
                    <span
                      className={
                        m.quantityChange > 0 ? "font-bold text-success-strong" : "font-bold text-danger-strong"
                      }
                    >
                      {`${m.quantityChange > 0 ? "+" : ""}${m.quantityChange} → ${m.resultingStock}`}
                    </span>
                    <span className="text-muted-foreground capitalize">{m.reason.replace(/_/g, " ")}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </>
      )}
    </div>
  );
}
