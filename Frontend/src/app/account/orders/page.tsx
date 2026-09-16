"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getOrders } from "@/lib/api/orders";
import { formatPrice } from "@/lib/format";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";

export default function OrderHistoryPage() {
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useCurrentUser();

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace("/login?next=/account/orders");
    }
  }, [userLoading, user, router]);

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: getOrders,
    enabled: !!user,
  });

  if (userLoading || !user) {
    return null;
  }

  return (
    <div className="page-shell py-stack-xl">
      <p className="eyebrow">Your account</p>
      <h1 className="mt-2 mb-10 font-heading text-headline-sm font-bold text-foreground md:text-headline-md">
        Order History
      </h1>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : !orders || orders.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center">
          <p className="mb-8 text-body-lg text-muted-foreground">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/"
            className="action-primary"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid gap-3">
          {orders.map((order) => (
            <Link
              key={order.orderNumber}
              href={`/account/orders/${order.orderNumber}`}
              className="surface flex flex-col gap-3 p-5 transition-colors hover:border-foreground/25 hover:bg-muted/30 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <p className="text-body-md font-medium text-foreground">{order.orderNumber}</p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                  {" · "}
                  {order.items.reduce((sum, i) => sum + i.quantity, 0)} item
                  {order.items.reduce((sum, i) => sum + i.quantity, 0) === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-center gap-6">
                <OrderStatusBadge fulfillmentStatus={order.fulfillmentStatus} paymentStatus={order.paymentStatus} />
                <p className="text-body-md font-semibold text-foreground">{formatPrice(order.total)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
