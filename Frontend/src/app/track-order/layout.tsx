import type { Metadata } from "next";
import { RESTAURANT } from "@/config/restaurant";

// The page itself is a client component and so cannot export metadata; a
// route layout is the smallest way to give it a real title without splitting
// the component in two for the sake of one constant.
export const metadata: Metadata = {
  title: `Track Your Order — ${RESTAURANT.name}`,
  description: `Look up a ${RESTAURANT.name} order with its order number and email address.`,
  // A lookup form has nothing to index, and the results are personal.
  robots: { index: false, follow: true },
};

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  return children;
}
