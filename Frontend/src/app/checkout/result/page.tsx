import { Suspense } from "react";
import type { Metadata } from "next";
import { CheckoutResultContent } from "./result-content";
import { RESTAURANT } from "@/config/restaurant";

export const metadata: Metadata = {
  title: `Payment Result — ${RESTAURANT.name}`,
  robots: { index: false, follow: false },
};

export default function CheckoutResultPage() {
  return (
    <Suspense>
      <CheckoutResultContent />
    </Suspense>
  );
}
