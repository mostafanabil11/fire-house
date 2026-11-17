"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Check, Clock, RotateCw, Send } from "lucide-react";
import Link from "next/link";
import { getNotifications, retryNotification } from "@/lib/api/notifications";
import type { NotificationStatus } from "@/lib/api/notifications";
import { formatAge } from "@/lib/staff-orders";
import { AdminPageHeader } from "@/components/admin/ui/page-header";
import { StatusPill, type StatusTone } from "@/components/admin/ui/status-pill";
import { EmptyState } from "@/components/admin/ui/empty-state";

const STATUS_STYLES: Record<NotificationStatus, { label: string; tone: StatusTone }> = {
  sent: { label: "Sent", tone: "success" },
  pending: { label: "Sending", tone: "warning" },
  failed: { label: "Failed", tone: "danger" },
  skipped: { label: "Not sent", tone: "neutral" },
};

export default function AdminNotificationsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "notifications"],
    queryFn: () => getNotifications(50),
    refetchInterval: 20_000,
  });

  const retryMutation = useMutation({
    mutationFn: retryNotification,
    onSuccess: () => {
      toast.success("Sending again");
      queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });
    },
    onError: () => toast.error("Could not resend that alert"),
  });

  return (
    <div className="grid gap-5">
      <AdminPageHeader
        title="Order alerts"
        description="Every WhatsApp message the team should have received when an order came in."
      />

      {data && !data.whatsappConfigured && (
        <div className="flex gap-3 rounded-2xl bg-warning-soft p-4 text-warning-strong">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} aria-hidden />
          <div className="text-sm">
            <p className="font-black">WhatsApp is not connected yet</p>
            <p className="mt-1">
              Alerts are still being written down — you can read below exactly what your team would
              have received. Add the WhatsApp credentials to start actually sending them; nothing
              else has to change.
            </p>
          </div>
        </div>
      )}

      {data && data.whatsappConfigured && (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm">
          <p>
            <span className="font-bold">Sending to:</span>{" "}
            {data.recipients.length > 0 ? data.recipients.map((r) => `+${r}`).join(", ") : "nobody"}
          </p>
          <p className="mt-1 text-muted-foreground">
            {data.usingTemplate
              ? "Using an approved WhatsApp template, so alerts arrive at any hour."
              : "Sending plain text, which WhatsApp only delivers within 24 hours of your team messaging the business number. Set a template name before you rely on this."}
          </p>
        </div>
      )}

      <div className="grid gap-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-muted" />
          ))
        ) : !data || data.entries.length === 0 ? (
          <EmptyState
            title="No alerts yet"
            description="One appears here the moment an order is placed."
          />
        ) : (
          data.entries.map((entry) => {
            const style = STATUS_STYLES[entry.status];
            return (
              <article key={entry._id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/orders/${entry.orderNumber}`}
                      className="font-heading text-base hover:underline" data-i18n-ignore
                    >
                      {entry.orderNumber}
                    </Link>
                    <StatusPill
                      tone={style.tone}
                      icon={
                        entry.status === "sent" ? (
                          <Check strokeWidth={3} aria-hidden />
                        ) : entry.status === "pending" ? (
                          <Clock strokeWidth={3} aria-hidden />
                        ) : undefined
                      }
                    >
                      {style.label}
                    </StatusPill>
                    {entry.event === "order.cancelled" && <StatusPill>Cancellation</StatusPill>}
                    {entry.deliveryStatus && (
                      <span className="text-xs text-muted-foreground">
                        {entry.deliveryStatus} on WhatsApp
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-muted-foreground">
                    to +{entry.recipient} · {formatAge(entry.createdAt)}
                  </span>
                </div>

                <pre data-i18n-ignore className="mt-3 overflow-x-auto rounded-xl bg-muted p-3 font-sans text-sm leading-6 whitespace-pre-wrap">
                  {entry.body}
                </pre>

                {entry.lastError && (
                  <p className="mt-2 text-sm text-danger-strong">
                    {entry.lastError}
                    {entry.attempts > 0 ? ` (tried ${entry.attempts}×)` : ""}
                  </p>
                )}

                {entry.status !== "sent" && (
                  <button
                    type="button"
                    onClick={() => retryMutation.mutate(entry._id)}
                    disabled={retryMutation.isPending}
                    className="action-secondary mt-3 min-h-11 rounded-xl px-4"
                  >
                    {entry.status === "skipped" ? (
                      <Send className="size-3.5" strokeWidth={2.5} aria-hidden />
                    ) : (
                      <RotateCw className="size-3.5" strokeWidth={2.5} aria-hidden />
                    )}
                    Send again
                  </button>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
