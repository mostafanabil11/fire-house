"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, BellOff, RefreshCw, Search, Volume2, VolumeX } from "lucide-react";
import { getAdminOrders } from "@/lib/api/orders";
import { useNewOrderAlert } from "@/hooks/use-new-order-alert";
import { OrderCard } from "@/components/admin/order-card";
import { STAFF_QUEUES, queueStatuses, type StaffQueue } from "@/lib/staff-orders";

// Slow enough not to hammer a free-tier API, fast enough that nobody is
// standing at the counter wondering whether the order arrived. The board also
// refetches the moment the tab is looked at again, which covers the case that
// actually matters: a phone waking up in someone's pocket.
const POLL_MS = 15_000;

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [queue, setQueue] = useState<StaffQueue>("waiting");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const statuses = queueStatuses(queue).join(",");

  const { data, isLoading, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["admin", "orders", queue, debouncedSearch],
    queryFn: () =>
      getAdminOrders({
        limit: 50,
        fulfillmentStatus: statuses,
        ...(debouncedSearch ? { q: debouncedSearch } : {}),
      }),
    refetchInterval: POLL_MS,
    refetchOnWindowFocus: true,
    // Keeps the previous tab's cards on screen while the next one loads,
    // instead of blanking the board on every tab press.
    placeholderData: (previous) => previous,
  });

  // Only the queue staff are actually waiting on should ring. Browsing the
  // completed tab must not announce anything.
  const alertableNumbers = useMemo(
    () => (queue === "waiting" ? (data?.items ?? []).map((o) => o.orderNumber) : []),
    [queue, data],
  );

  const {
    unseenCount,
    clearUnseen,
    soundOn,
    toggleSound,
    requestPermission,
    notificationPermission,
  } = useNewOrderAlert(alertableNumbers, queue === "waiting");

  // The tab title is the only part of this screen visible when the browser is
  // in the background, which is where it spends most of a shift.
  useEffect(() => {
    const base = "Orders · Admin";
    document.title = unseenCount > 0 ? `(${unseenCount}) ${base}` : base;
    return () => {
      document.title = base;
    };
  }, [unseenCount]);

  const orders = data?.items ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-black tracking-tight">Orders</h1>

        <div className="flex items-center gap-2">
          {unseenCount > 0 && (
            <button
              type="button"
              onClick={clearUnseen}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-black text-primary-foreground"
            >
              {unseenCount} new
            </button>
          )}

          <button
            type="button"
            onClick={toggleSound}
            aria-pressed={soundOn}
            title={soundOn ? "Mute new-order sound" : "Unmute new-order sound"}
            className="grid size-10 place-items-center rounded-full border border-border"
          >
            {soundOn ? (
              <Volume2 className="size-4" strokeWidth={2} />
            ) : (
              <VolumeX className="size-4 text-muted-foreground" strokeWidth={2} />
            )}
            <span className="sr-only">{soundOn ? "Sound on" : "Sound off"}</span>
          </button>

          {notificationPermission !== "granted" && notificationPermission !== "unsupported" && (
            <button
              type="button"
              onClick={requestPermission}
              title="Get a desktop notification for new orders"
              className="grid size-10 place-items-center rounded-full border border-border"
            >
              {notificationPermission === "denied" ? (
                <BellOff className="size-4 text-muted-foreground" strokeWidth={2} />
              ) : (
                <Bell className="size-4" strokeWidth={2} />
              )}
              <span className="sr-only">Enable desktop notifications</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
              void refetch();
            }}
            title="Refresh now"
            className="grid size-10 place-items-center rounded-full border border-border"
          >
            <RefreshCw
              className={`size-4 ${isFetching ? "animate-spin" : ""}`}
              strokeWidth={2}
            />
            <span className="sr-only">Refresh</span>
          </button>
        </div>
      </div>

      <p className="mt-1 text-xs text-muted-foreground">
        Updates by itself every {POLL_MS / 1000} seconds
        {dataUpdatedAt
          ? ` · last checked ${new Date(dataUpdatedAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}`
          : ""}
      </p>

      <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STAFF_QUEUES.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setQueue(tab.key)}
            aria-current={queue === tab.key ? "true" : undefined}
            className={`inline-flex min-h-11 shrink-0 items-center rounded-full px-4 text-sm font-bold transition-colors ${
              queue === tab.key
                ? "bg-foreground text-background"
                : "border border-border hover:border-foreground/30"
            }`}
          >
            {tab.label}
            {queue === tab.key && data ? ` · ${data.pagination.total}` : ""}
          </button>
        ))}
      </div>

      <label className="mt-3 flex items-center gap-2 rounded-full border border-border px-4">
        <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} aria-hidden />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Order number, name or phone"
          aria-label="Search orders"
          className="min-h-11 w-full bg-transparent text-base outline-none"
        />
      </label>

      <div className="mt-4 grid gap-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-36 animate-pulse rounded-2xl bg-muted" />
          ))
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <p className="font-bold">
              {debouncedSearch ? `Nothing matches “${debouncedSearch}”.` : "Nothing here right now."}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {queue === "waiting"
                ? "New orders appear here on their own."
                : "Try another tab."}
            </p>
          </div>
        ) : (
          orders.map((order) => <OrderCard key={order._id} order={order} />)
        )}
      </div>

      {data && data.pagination.total > orders.length && (
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Showing the {orders.length} most recent of {data.pagination.total}. Search to find older
          ones.
        </p>
      )}
    </div>
  );
}
