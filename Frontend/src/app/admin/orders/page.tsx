"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BellRing,
  CheckCircle2,
  RefreshCw,
  Search,
  Volume2,
  VolumeX,
  WifiOff,
  X,
} from "lucide-react";
import { getAdminOrders, type AdminOrderListItem } from "@/lib/api/orders";
import { useWaitingOrders, WAITING_POLL_MS } from "@/hooks/use-waiting-orders";
import { useStaffAlerts } from "@/components/admin/new-order-watcher";
import { OrderTicket } from "@/components/admin/order-ticket";
import { OrderRowList } from "@/components/admin/order-row";
import { AdminPageHeader } from "@/components/admin/ui/page-header";
import { Segmented } from "@/components/admin/ui/segmented";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { groupByDay, queueStatuses, splitWaiting, type StaffQueue } from "@/lib/staff-orders";
import { useLanguage } from "@/i18n/language-provider";
import { cn } from "@/lib/utils";

// Past this, the board says plainly that it has stopped updating rather than
// quietly showing orders that may be minutes old.
const STALE_AFTER_MS = 30_000;
const ALERTS_DISMISSED_KEY = "firehouse-admin-alerts-dismissed";

function readAlertsDismissed(): boolean {
  try {
    return window.localStorage.getItem(ALERTS_DISMISSED_KEY) === "1";
  } catch {
    return false;
  }
}

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

function shortTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function TicketSkeletons() {
  return (
    <div className="grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-3">
      {[0, 1, 2].map((index) => (
        <div key={index} className="h-96 animate-pulse rounded-2xl bg-muted" />
      ))}
    </div>
  );
}

function Banner({
  tone,
  icon,
  children,
  action,
}: {
  tone: "danger" | "warning" | "neutral";
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold [&>svg]:size-5 [&>svg]:shrink-0",
        tone === "danger" && "bg-danger-soft text-danger-strong",
        tone === "warning" && "bg-warning-soft text-warning-strong",
        tone === "neutral" && "border border-border bg-card text-foreground",
      )}
    >
      {icon}
      <div className="min-w-[12rem] flex-1">{children}</div>
      {action && <div className="flex flex-wrap gap-2">{action}</div>}
    </div>
  );
}

const smallButton =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 text-sm font-bold text-foreground transition-colors hover:bg-muted";

export default function AdminOrdersPage() {
  const { t } = useLanguage();
  const alerts = useStaffAlerts();
  const [queue, setQueue] = useState<StaffQueue>("waiting");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [historyLimit, setHistoryLimit] = useState(50);
  const [alertsDismissed, setAlertsDismissed] = useState(readAlertsDismissed);
  const now = useNow(5_000);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(id);
  }, [search]);

  const searching = debouncedSearch.length > 0;
  const waiting = useWaitingOrders();

  const history = useQuery({
    queryKey: ["admin", "orders", queue, "", historyLimit],
    queryFn: () =>
      getAdminOrders({ limit: historyLimit, fulfillmentStatus: queueStatuses(queue).join(",") }),
    enabled: queue !== "waiting" && !searching,
    refetchInterval: WAITING_POLL_MS,
    placeholderData: (previous) => previous,
  });

  // A customer on the phone could be in any tab, so search looks everywhere.
  const results = useQuery({
    queryKey: ["admin", "orders", "search", debouncedSearch],
    queryFn: () => getAdminOrders({ limit: 50, q: debouncedSearch }),
    enabled: searching,
    placeholderData: (previous) => previous,
  });

  const { toConfirm, awaitingPayment } = useMemo(
    () => splitWaiting<AdminOrderListItem>(waiting.data?.items ?? []),
    [waiting.data],
  );

  const lastUpdated = waiting.dataUpdatedAt;
  const stale = waiting.isError || (lastUpdated > 0 && now - lastUpdated > STALE_AFTER_MS);
  const freshSet = useMemo(() => new Set(alerts.freshNumbers), [alerts.freshNumbers]);

  function refreshNow() {
    void waiting.refetch();
    if (queue !== "waiting") void history.refetch();
  }

  function showNew() {
    const first = toConfirm.find((order) => freshSet.has(order.orderNumber));
    alerts.clearUnseen();
    setQueue("waiting");
    setSearch("");
    if (first) {
      document
        .getElementById(`ticket-${first.orderNumber}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function dismissAlertsPrompt() {
    setAlertsDismissed(true);
    try {
      window.localStorage.setItem(ALERTS_DISMISSED_KEY, "1");
    } catch {
      // Asked again after a reload instead.
    }
  }

  const historyGroups = useMemo(
    () => groupByDay<AdminOrderListItem>(history.data?.items ?? []),
    [history.data],
  );

  return (
    <div className="grid gap-5">
      <AdminPageHeader title="Orders">
        {alerts.unseenCount > 0 && (
          <button
            type="button"
            onClick={showNew}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-extrabold text-primary-foreground"
          >
            <BellRing className="size-4" aria-hidden />
            {`${alerts.unseenCount} new`}
          </button>
        )}

        {!stale && lastUpdated > 0 && (
          <span className="inline-flex min-h-11 items-center gap-2 px-1 text-sm font-semibold text-muted-foreground">
            <span className="relative flex size-2.5" aria-hidden>
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-success" />
            </span>
            {`Live · ${shortTime(lastUpdated)}`}
          </span>
        )}

        <button
          type="button"
          onClick={alerts.toggleSound}
          aria-pressed={alerts.soundOn}
          aria-label={alerts.soundOn ? "Sound on" : "Sound off"}
          className={smallButton}
        >
          {alerts.soundOn ? (
            <Volume2 className="size-4" aria-hidden />
          ) : (
            <VolumeX className="size-4 text-muted-foreground" aria-hidden />
          )}
          <span className="hidden sm:inline">{alerts.soundOn ? "Sound on" : "Sound off"}</span>
        </button>

        <button
          type="button"
          onClick={refreshNow}
          aria-label="Refresh now"
          title="Refresh now"
          className={cn(smallButton, "w-11 px-0")}
        >
          <RefreshCw className={cn("size-4", waiting.isFetching && "animate-spin")} aria-hidden />
        </button>
      </AdminPageHeader>

      {stale && (
        <Banner
          tone="danger"
          icon={<WifiOff aria-hidden />}
          action={
            <button type="button" onClick={refreshNow} className={smallButton}>
              <RefreshCw className="size-4" aria-hidden />
              Try again
            </button>
          }
        >
          <p className="font-bold">Not updating — check the internet connection.</p>
          {lastUpdated > 0 && (
            <p className="mt-0.5 font-normal">{`Last updated ${shortTime(lastUpdated)}`}</p>
          )}
        </Banner>
      )}

      {alerts.soundBlocked && (
        <Banner tone="warning" icon={<Volume2 aria-hidden />}>
          Tap anywhere to switch the order sound on.
        </Banner>
      )}

      {alerts.notificationPermission === "default" && !alertsDismissed && (
        <Banner
          tone="neutral"
          icon={<BellRing className="text-primary" aria-hidden />}
          action={
            <>
              <button
                type="button"
                onClick={() => void alerts.requestPermission()}
                className={cn(smallButton, "border-primary bg-primary text-primary-foreground hover:bg-primary hover:brightness-110")}
              >
                Turn on alerts
              </button>
              <button type="button" onClick={dismissAlertsPrompt} className={smallButton}>
                Not now
              </button>
            </>
          }
        >
          Get an alert on this device when an order arrives, even with this tab in the background.
        </Banner>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Segmented
          label="Order status"
          value={searching ? null : queue}
          onChange={(next) => {
            setQueue(next);
            setSearch("");
          }}
          options={[
            { value: "waiting", label: "Waiting", count: alerts.waitingCount },
            { value: "confirmed", label: "Confirmed" },
            { value: "cancelled", label: "Cancelled" },
          ]}
        />
        <label className="flex min-h-12 flex-1 items-center gap-2 rounded-2xl border border-border bg-card px-4 md:max-w-md md:ms-auto">
          <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Order number, name or phone"
            aria-label="Search orders"
            className="min-h-11 w-full min-w-0 bg-transparent text-base outline-none"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="-me-2 grid size-10 shrink-0 place-items-center rounded-full hover:bg-muted"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </label>
      </div>

      {searching ? (
        <section className="grid gap-3">
          <h2 className="font-heading text-lg">{`Results for “${debouncedSearch}”`}</h2>
          {results.isLoading ? (
            <div className="h-40 animate-pulse rounded-2xl bg-muted" />
          ) : results.isError ? (
            <EmptyState
              icon={<WifiOff aria-hidden />}
              title="Could not search right now"
              action={
                <button type="button" onClick={() => void results.refetch()} className={smallButton}>
                  Try again
                </button>
              }
            />
          ) : (results.data?.items.length ?? 0) === 0 ? (
            <EmptyState
              icon={<Search aria-hidden />}
              title={`Nothing matches “${debouncedSearch}”.`}
              description="Try the order number, or the last digits of the phone number."
            />
          ) : (
            <OrderRowList orders={results.data!.items} />
          )}
        </section>
      ) : queue === "waiting" ? (
        waiting.isLoading ? (
          <TicketSkeletons />
        ) : waiting.isError && !waiting.data ? (
          <EmptyState
            icon={<WifiOff aria-hidden />}
            title="Could not load orders"
            description="Check the internet connection."
            action={
              <button type="button" onClick={refreshNow} className={smallButton}>
                Try again
              </button>
            }
          />
        ) : toConfirm.length === 0 && awaitingPayment.length === 0 ? (
          <EmptyState
            icon={<CheckCircle2 aria-hidden />}
            title="All caught up"
            description="New orders appear here by themselves and ring this device."
          />
        ) : (
          <div className="grid gap-8">
            {toConfirm.length > 0 && (
              <section aria-label="To confirm" className="grid items-start gap-4 md:grid-cols-2 2xl:grid-cols-3">
                {toConfirm.map((order) => (
                  <div key={order._id} id={`ticket-${order.orderNumber}`} className="scroll-mt-24 h-full">
                    <OrderTicket
                      order={order}
                      isNew={freshSet.has(order.orderNumber)}
                      onSeen={() => alerts.dismissFresh(order.orderNumber)}
                    />
                  </div>
                ))}
              </section>
            )}
            {toConfirm.length === 0 && (
              <EmptyState
                icon={<CheckCircle2 aria-hidden />}
                title="Nothing to confirm"
                description="New orders appear here by themselves and ring this device."
              />
            )}
            {awaitingPayment.length > 0 && (
              <section className="grid gap-3">
                <div>
                  <h2 className="font-heading text-lg">
                    {`Waiting for card payment · ${awaitingPayment.length}`}
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    These customers have not finished paying. Nothing to do yet — they move up by
                    themselves when the payment goes through.
                  </p>
                </div>
                <OrderRowList orders={awaitingPayment} />
              </section>
            )}
          </div>
        )
      ) : history.isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      ) : history.isError && !history.data ? (
        <EmptyState
          icon={<WifiOff aria-hidden />}
          title="Could not load orders"
          description="Check the internet connection."
          action={
            <button type="button" onClick={() => void history.refetch()} className={smallButton}>
              Try again
            </button>
          }
        />
      ) : historyGroups.length === 0 ? (
        <EmptyState
          title={queue === "confirmed" ? "No confirmed orders yet" : "No cancelled orders"}
        />
      ) : (
        <div className="grid gap-6">
          {historyGroups.map((group) => (
            <section key={group.label} className="grid gap-2">
              <h2 className="px-1 text-sm font-bold text-muted-foreground">{t(group.label)}</h2>
              <OrderRowList orders={group.orders} />
            </section>
          ))}
          {history.data && history.data.pagination.total > history.data.items.length && (
            <div className="text-center">
              {historyLimit < 100 ? (
                <button
                  type="button"
                  onClick={() => setHistoryLimit(100)}
                  className={smallButton}
                  disabled={history.isFetching}
                >
                  Show more
                </button>
              ) : (
                <p className="text-sm text-muted-foreground">Search to find older orders.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
