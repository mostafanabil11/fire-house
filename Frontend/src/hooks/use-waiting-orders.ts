"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminOrders } from "@/lib/api/orders";
import { queueStatuses } from "@/lib/staff-orders";

// Slow enough not to hammer a free-tier API, fast enough that nobody is
// standing at the counter wondering whether the order arrived.
export const WAITING_POLL_MS = 10_000;

export const WAITING_ORDERS_KEY = ["admin", "orders", "waiting", ""] as const;

/**
 * Every order still waiting on staff. One query for the whole admin: the
 * watcher in the layout (which rings), the board's Waiting tab, the nav badge
 * and the overview all read this same cache entry, so it is one request every
 * ten seconds however many of them are on screen.
 */
export function useWaitingOrders() {
  return useQuery({
    queryKey: WAITING_ORDERS_KEY,
    queryFn: () =>
      getAdminOrders({ limit: 50, fulfillmentStatus: queueStatuses("waiting").join(",") }),
    refetchInterval: WAITING_POLL_MS,
    // Keep polling while the tab is hidden. The chime and the notification
    // exist for exactly that moment — staff on another tab or with the
    // browser minimised.
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    // Never blank the board between polls.
    placeholderData: (previous) => previous,
    // Polling retries on its own; a failed poll should surface quickly as
    // "not updating" rather than sit through a retry first.
    retry: false,
  });
}
