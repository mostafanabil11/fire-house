"use client";

import { usePathname } from "next/navigation";

// The customer site's header, footer and cart bar have no place on the staff
// screens, which bring their own navigation. A wrapper rather than a route
// group: a group would mean moving every customer route, and the root 404 and
// error pages would lose the site header with them.
export function StorefrontOnly({ children }: { children: React.ReactNode }) {
  return usePathname().startsWith("/admin") ? null : children;
}
