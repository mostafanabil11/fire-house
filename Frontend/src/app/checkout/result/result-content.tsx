"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { XCircle, Loader2 } from "lucide-react";

// Landing point for the payment provider's browser redirect. The webhook is
// what actually settles the order, so this page's only job is to route the
// customer somewhere sensible — it never decides the outcome itself.
export function CheckoutResultContent() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();

  const status = params.get("status");
  const orderNumber = params.get("order");

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ["cart", "server"] });
    queryClient.invalidateQueries({ queryKey: ["orders"] });

    if (status === "success" && orderNumber) {
      router.replace(`/order-confirmation/${orderNumber}`);
    }
  }, [status, orderNumber, router, queryClient]);

  if (status === "success") {
    return (
      <div className="page-shell flex flex-col items-center text-center">
        <Loader2 className="mb-4 size-8 animate-spin text-muted-foreground" strokeWidth={1.5} />
        <p className="text-base text-muted-foreground">Confirming your payment…</p>
      </div>
    );
  }

  return (
    <div className="page-shell flex flex-col items-center text-center">
      <XCircle className="mb-4 size-12 text-destructive" strokeWidth={1} />
      <h1 className="mb-3 font-heading text-3xl sm:text-4xl text-foreground">Payment not completed</h1>
      <p className="mb-2 max-w-md text-base text-muted-foreground">
        Your payment wasn&apos;t completed, so we haven&apos;t charged you and your order hasn&apos;t been placed.
      </p>
      <p className="mb-8 max-w-md text-sm text-muted-foreground">
        Your bag is still saved — you can try again with the same card or choose cash on delivery.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/checkout"
          className="action-primary"
        >
          Try again
        </Link>
        <Link
          href="/cart"
          className="action-secondary"
        >
          Back to your order
        </Link>
      </div>
    </div>
  );
}
