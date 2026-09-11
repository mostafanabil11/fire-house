import { Suspense } from "react";
import type { Metadata } from "next";
import { PaymentCallbackContent } from "./payment-callback-content";
import { RESTAURANT } from "@/config/restaurant";

export const metadata: Metadata = {
  title: `Processing Payment — ${RESTAURANT.name}`,
  robots: { index: false, follow: false },
};

export default function PaymentCallbackPage() {
  return (
    <Suspense>
      <PaymentCallbackContent />
    </Suspense>
  );
}
