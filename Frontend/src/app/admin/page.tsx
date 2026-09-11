"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, TrendingUp } from "lucide-react";
import { getDashboard } from "@/lib/api/admin";
import { getAdminOrders } from "@/lib/api/orders";
import { formatPrice } from "@/lib/format";
import { OrderCard } from "@/components/admin/order-card";
import { queueStatuses } from "@/lib/staff-orders";

function Stat({
  label,
  value,
  hint,
  emphasis = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        emphasis ? "border-foreground bg-foreground text-background" : "border-border bg-card"
      }`}
    >
      <p
        className={`text-[0.7rem] font-black tracking-[0.12em] uppercase ${
          emphasis ? "text-background/60" : "text-muted-foreground"
        }`}
      >
        {label}
      </p>
      <p className="mt-1.5 font-heading text-3xl font-black tracking-tight">{value}</p>
      {hint && (
        <p className={`mt-1 text-xs ${emphasis ? "text-background/60" : "text-muted-foreground"}`}>
          {hint}
        </p>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "dashboard"], queryFn: getDashboard });

  // The dashboard opens on the work, not on analytics — the first thing the
  // owner wants to know is whether anything is waiting.
  const { data: waiting } = useQuery({
    queryKey: ["admin", "orders", "action", ""],
    queryFn: () => getAdminOrders({ limit: 5, fulfillmentStatus: queueStatuses("waiting").join(",") }),
    refetchInterval: 15_000,
  });

  const needsAction = waiting?.pagination.total ?? 0;

  return (
    <div>
      <h1 className="font-heading text-2xl font-black tracking-tight">Dashboard</h1>

      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          label="Waiting"
          value={needsAction}
          hint={needsAction === 0 ? "All caught up" : "To confirm"}
          emphasis={needsAction > 0}
        />
        <Stat
          label="Revenue"
          value={isLoading || !data ? "…" : formatPrice(data.revenue)}
          hint="Paid orders, all time"
        />
        <Stat label="Orders" value={isLoading || !data ? "…" : data.totalOrders} />
        <Stat
          label="Confirmed"
          value={isLoading || !data ? "…" : (data.ordersByStatus.confirmed ?? 0)}
        />
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-lg font-black">Waiting now</h2>
          <Link
            href="/admin/orders"
            className="inline-flex min-h-10 items-center gap-1 text-sm font-bold text-primary hover:underline"
          >
            All orders <ChevronRight className="size-4" aria-hidden />
          </Link>
        </div>

        <div className="mt-3 grid gap-3">
          {!waiting ? (
            <div className="h-32 animate-pulse rounded-2xl bg-muted" />
          ) : waiting.items.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="font-bold">Nothing waiting</p>
              <p className="mt-1 text-sm text-muted-foreground">
                New orders show up here and on the orders screen by themselves.
              </p>
            </div>
          ) : (
            waiting.items.map((order) => <OrderCard key={order._id} order={order} />)
          )}
        </div>
      </section>

      {data && data.topProducts.length > 0 && (
        <section className="mt-8">
          <h2 className="flex items-center gap-2 font-heading text-lg font-black">
            <TrendingUp className="size-5 text-primary" strokeWidth={2.5} aria-hidden />
            Best sellers
          </h2>
          <ul className="mt-3 grid gap-2">
            {data.topProducts.map((product) => (
              <li
                key={product._id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-3 text-sm"
              >
                <span className="font-bold">{product.name}</span>
                <span className="shrink-0 text-muted-foreground">
                  {product.quantitySold} sold · {formatPrice(product.revenue)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
