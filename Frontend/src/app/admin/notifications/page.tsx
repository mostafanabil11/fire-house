"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Check, Clock, RotateCw, Send } from "lucide-react";
import Link from "next/link";
import { getNotifications, retryNotification } from "@/lib/api/notifications";
import type { NotificationStatus } from "@/lib/api/notifications";
import { formatAge } from "@/lib/staff-orders";

const STATUS_STYLES: Record<NotificationStatus, { label: string; className: string }> = {
  sent: { label: "Sent", className: "bg-[var(--success)]/15 text-foreground" },
  pending: { label: "Sending", className: "bg-accent text-accent-foreground" },
  failed: { label: "Failed", className: "bg-destructive/15 text-destructive" },
  skipped: { label: "Not sent", className: "bg-muted text-muted-foreground" },
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
    <div>
      <h1 className="font-heading text-2xl font-black tracking-tight">Order alerts</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Every WhatsApp message the team should have received when an order came in.
      </p>

      {data && !data.whatsappConfigured && (
        <div className="mt-5 flex gap-3 rounded-2xl border border-accent bg-accent/40 p-4">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} aria-hidden />
          <div className="text-sm">
            <p className="font-black">WhatsApp is not connected yet</p>
            <p className="mt-1 text-muted-foreground">
              Alerts are still being written down — you can read below exactly what your team would
              have received. Add the WhatsApp credentials to start actually sending them; nothing
              else has to change.
            </p>
          </div>
        </div>
      )}

      {data && data.whatsappConfigured && (
        <div className="mt-5 rounded-2xl border border-border bg-card p-4 text-sm">
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

      <div className="mt-5 grid gap-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-2xl bg-muted" />
          ))
        ) : !data || data.entries.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <p className="font-bold">No alerts yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              One appears here the moment an order is placed.
            </p>
          </div>
        ) : (
          data.entries.map((entry) => {
            const style = STATUS_STYLES[entry.status];
            return (
              <article key={entry._id} className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/orders/${entry.orderNumber}`}
                      className="font-heading text-base font-black hover:underline"
                    >
                      {entry.orderNumber}
                    </Link>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.7rem] font-black uppercase ${style.className}`}
                    >
                      {entry.status === "sent" ? (
                        <Check className="size-3" strokeWidth={3} aria-hidden />
                      ) : entry.status === "pending" ? (
                        <Clock className="size-3" strokeWidth={3} aria-hidden />
                      ) : null}
                      {style.label}
                    </span>
                    {entry.event === "order.cancelled" && (
                      <span className="rounded-full bg-muted px-2.5 py-0.5 text-[0.7rem] font-black uppercase">
                        Cancellation
                      </span>
                    )}
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

                <pre className="mt-3 overflow-x-auto rounded-xl bg-muted p-3 font-sans text-xs leading-5 whitespace-pre-wrap">
                  {entry.body}
                </pre>

                {entry.lastError && (
                  <p className="mt-2 text-xs text-destructive">
                    {entry.lastError}
                    {entry.attempts > 0 ? ` (tried ${entry.attempts}×)` : ""}
                  </p>
                )}

                {entry.status !== "sent" && (
                  <button
                    type="button"
                    onClick={() => retryMutation.mutate(entry._id)}
                    disabled={retryMutation.isPending}
                    className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-border px-4 text-xs font-bold disabled:opacity-50"
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
