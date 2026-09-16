"use client";

import { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";

/**
 * Paymob redirects here after the customer completes (or fails) a card payment.
 * The redirect URL contains query params like `success`, `order`, `id`, etc.
 * We read `success` to show the right message and guide the user forward.
 *
 * The actual order status update happens server-side via the Paymob webhook,
 * so this page is purely informational / UX.
 */
export function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get("success") === "true" ? "success" : "failed";

  useEffect(() => {
    if (status === "success") {
      // Give the webhook a moment to process, then redirect to order confirmation
      const timer = setTimeout(() => {
        // The merchant_order_id param from Paymob contains our order number
        const merchantOrderId = searchParams.get("merchant_order_id");
        if (merchantOrderId) {
          router.push(`/order-confirmation/${merchantOrderId}`);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, router, status]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-margin-mobile">
      <div className="w-full max-w-md text-center">
        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-green-50">
              <CheckCircle2 className="size-10 text-green-600" strokeWidth={1.5} />
            </div>
            <h1 className="font-heading text-headline-sm font-bold text-foreground">
              Payment Successful!
            </h1>
            <p className="text-sm text-muted-foreground">
              Your payment has been confirmed. Redirecting you to your order details…
            </p>
            <div className="mt-2 flex size-5 items-center justify-center">
              <Loader2 className="size-5 animate-spin text-muted-foreground" strokeWidth={2} />
            </div>
          </div>
        )}

        {status === "failed" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex size-16 items-center justify-center rounded-full bg-red-50">
              <XCircle className="size-10 text-red-500" strokeWidth={1.5} />
            </div>
            <h1 className="font-heading text-headline-sm font-bold text-foreground">
              Payment Failed
            </h1>
            <p className="text-sm text-muted-foreground">
              Your payment could not be processed. Please try again or choose a different payment method.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/checkout"
                className="rounded-lg bg-primary px-6 py-3 text-button font-medium tracking-[0.05em] text-primary-foreground uppercase transition-colors hover:bg-primary/90"
              >
                Try Again
              </Link>
              <Link
                href="/cart"
                className="rounded-lg border border-border px-6 py-3 text-button font-medium tracking-[0.05em] text-foreground uppercase transition-colors hover:bg-muted"
              >
                Back to Cart
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
