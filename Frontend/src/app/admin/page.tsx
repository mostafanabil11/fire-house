"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, CheckCircle2, TrendingUp } from "lucide-react";
import { getDashboard } from "@/lib/api/admin";
import { formatPrice } from "@/lib/format";
import { useWaitingOrders } from "@/hooks/use-waiting-orders";
import { useStaffAlerts } from "@/components/admin/new-order-watcher";
import { OrderRowList } from "@/components/admin/order-row";
import { AdminPageHeader } from "@/components/admin/ui/page-header";
import { Panel } from "@/components/admin/ui/panel";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { splitWaiting } from "@/lib/staff-orders";
import { T } from "@/i18n/language-provider";
import { cn } from "@/lib/utils";
import type { AdminOrderListItem } from "@/lib/api/orders";

function Tile({
  label,
  value,
  hint,
  emphasis = false,
  href,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  emphasis?: boolean;
  href?: string;
}) {
  const body = (
    <>
      <p className={cn("text-sm font-bold", emphasis ? "text-background/70" : "text-muted-foreground")}>
        {label}
      </p>
      <p className="mt-1.5 font-heading text-3xl tabular-nums">{value}</p>
      {hint && (
        <p className={cn("mt-1 text-xs", emphasis ? "text-background/70" : "text-muted-foreground")}>
          {hint}
        </p>
      )}
    </>
  );
  const className = cn(
    "block rounded-2xl border p-4 sm:p-5",
    emphasis ? "border-foreground bg-foreground text-background" : "border-border bg-card",
    href && "transition-transform hover:-translate-y-0.5",
  );
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export default function AdminOverviewPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin", "dashboard"], queryFn: getDashboard });
  const waiting = useWaitingOrders();
  const { waitingCount } = useStaffAlerts();

  // Orders staff can confirm first, then any waiting on a card payment; each
  // oldest first.
  const waitingList = useMemo(() => {
    const { toConfirm, awaitingPayment } = splitWaiting<AdminOrderListItem>(
      waiting.data?.items ?? [],
    );
    return [...toConfirm, ...awaitingPayment].slice(0, 5);
  }, [waiting.data]);

  const loading = isLoading || !data;
  const topSold = data?.topProducts[0]?.quantitySold ?? 0;

  return (
    <div className="grid gap-6">
      <AdminPageHeader title="Overview" />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile
          label="Waiting now"
          value={waitingCount}
          hint={waitingCount === 0 ? "All caught up" : "To confirm"}
          emphasis={waitingCount > 0}
          href="/admin/orders"
        />
        <Tile label="Orders" value={loading ? "…" : data.totalOrders} hint="All time" />
        <Tile
          label="Confirmed"
          value={loading ? "…" : (data.ordersByStatus.confirmed ?? 0)}
          hint="All time"
        />
        <Tile
          label="Revenue"
          value={loading ? "…" : <T>{formatPrice(data.revenue)}</T>}
          hint="Paid orders, all time"
        />
      </div>

      <section className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-xl">Waiting now</h2>
          <Link href="/admin/orders" className="action-secondary min-h-11 px-4">
            Open orders
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
        {!waiting.data ? (
          <div className="h-32 animate-pulse rounded-2xl bg-muted" />
        ) : waitingList.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 aria-hidden />}
            title="Nothing waiting"
            description="New orders show up here and on the orders screen by themselves."
          />
        ) : (
          <OrderRowList orders={waitingList} />
        )}
      </section>

      {data && data.topProducts.length > 0 && (
        <Panel
          title={
            <span className="flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" strokeWidth={2.5} aria-hidden />
              Best sellers
            </span>
          }
        >
          <ol className="grid gap-4">
            {data.topProducts.map((product, index) => (
              <li key={product._id} className="flex items-start gap-3">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-sm font-extrabold tabular-nums">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                    <p className="font-bold">
                      <T>{product.name}</T>
                    </p>
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {`${product.quantitySold} sold`}
                      <span aria-hidden> · </span>
                      <T>{formatPrice(product.revenue)}</T>
                    </p>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${topSold > 0 ? Math.max(4, (product.quantitySold / topSold) * 100) : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      )}
    </div>
  );
}
