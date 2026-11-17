"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import { useWaitingOrders } from "@/hooks/use-waiting-orders";
import { useNewOrderAlert } from "@/hooks/use-new-order-alert";
import { useLanguage } from "@/i18n/language-provider";
import { canConfirm } from "@/lib/staff-orders";

type AlertState = ReturnType<typeof useNewOrderAlert>;

interface StaffAlerts extends AlertState {
  // Orders staff can confirm right now — the number on the Orders badge.
  waitingCount: number;
}

const StaffAlertsContext = createContext<StaffAlerts | null>(null);

/**
 * Mounted once by the admin layout, so a new order rings on every staff
 * screen — not only while the board happens to be open. Someone editing the
 * menu during service still hears the doorbell.
 */
export function NewOrderWatcher({ children }: { children: React.ReactNode }) {
  const { data, isSuccess } = useWaitingOrders();
  const { t } = useLanguage();
  const orders = useMemo(() => data?.items ?? [], [data]);
  const alerts = useNewOrderAlert(orders, isSuccess);
  const waitingCount = useMemo(() => orders.filter(canConfirm).length, [orders]);

  // The tab title is the only part of the dashboard visible while the browser
  // is in the background, which is where it spends most of a shift.
  const { unseenCount } = alerts;
  useEffect(() => {
    const base = "Orders · Admin";
    document.title = t(unseenCount > 0 ? `(${unseenCount}) ${base}` : base);
  }, [unseenCount, t]);

  const value = useMemo(() => ({ ...alerts, waitingCount }), [alerts, waitingCount]);

  return <StaffAlertsContext.Provider value={value}>{children}</StaffAlertsContext.Provider>;
}

export function useStaffAlerts(): StaffAlerts {
  const context = useContext(StaffAlertsContext);
  if (!context) throw new Error("useStaffAlerts must be used inside NewOrderWatcher");
  return context;
}
