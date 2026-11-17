"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getOrder } from "@/lib/api/orders";
import { OrderDetail } from "@/components/orders/order-detail";
import { OrderStatusBadge } from "@/components/orders/order-status-badge";

export default function AccountOrderDetailPage() {
  const params = useParams<{ orderNumber: string }>();
  const router = useRouter();
  const { data: user, isLoading: userLoading } = useCurrentUser();

  useEffect(() => {
    if (!userLoading && !user) {
      router.replace(`/login?next=/account/orders/${params.orderNumber}`);
    }
  }, [userLoading, user, router, params.orderNumber]);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["orders", params.orderNumber],
    queryFn: () => getOrder(params.orderNumber),
    enabled: !!user,
  });

  if (userLoading || !user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="page-shell">
        <div className="h-40 animate-pulse bg-muted" />
      </div>
    );
  }

  if (isError || !order) {
    return (
      <div className="page-shell flex flex-col items-center text-center">
        <h1 className="mb-4 font-heading text-3xl sm:text-4xl text-foreground">Order not found</h1>
        <Link href="/account/orders" className="text-sm text-muted-foreground underline">
          Back to order history
        </Link>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <Link href="/account/orders" className="mb-6 inline-block text-sm text-muted-foreground underline">
        ← Back to order history
      </Link>

      <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-3xl sm:text-4xl text-foreground">
            {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <OrderStatusBadge fulfillmentStatus={order.fulfillmentStatus} paymentStatus={order.paymentStatus} />
      </div>

      <OrderDetail order={order} />
    </div>
  );
}
