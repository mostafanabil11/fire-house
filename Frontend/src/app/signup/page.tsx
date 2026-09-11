import { Suspense } from "react";
import type { Metadata } from "next";
import { SignupContent } from "./signup-content";
import { RESTAURANT } from "@/config/restaurant";

export const metadata: Metadata = {
  title: `Create an account — ${RESTAURANT.name}`,
  robots: { index: false, follow: true },
};

// Split page/content because SignupContent reads ?next= via useSearchParams,
// which suspends — without a boundary here the whole route fails to prerender.
// Same shape as /login and /search.
export default function SignupPage() {
  return (
    <Suspense>
      <SignupContent />
    </Suspense>
  );
}
