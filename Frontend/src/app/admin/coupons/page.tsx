"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ChevronRight, Plus, Tag, Trash2 } from "lucide-react";
import { getCoupons, deleteCoupon } from "@/lib/api/coupons";
import { formatPrice } from "@/lib/format";
import { errorMessage } from "@/lib/api/error-message";
import { AdminPageHeader } from "@/components/admin/ui/page-header";
import { StatusPill } from "@/components/admin/ui/status-pill";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import type { Coupon } from "@/types/coupon";

function describeCoupon(c: { type: string; value: number }): string {
  if (c.type === "percentage") return `${c.value}% off`;
  if (c.type === "fixed") return `${formatPrice(c.value)} off`;
  return "Free delivery";
}

function couponStatus(c: Coupon): { label: string; tone: "success" | "neutral" | "warning" } {
  if (!c.isActive) return { label: "Inactive", tone: "neutral" };
  if (c.endsAt && new Date(c.endsAt).getTime() < Date.now()) return { label: "Expired", tone: "neutral" };
  if (c.usageLimit && c.usedCount >= c.usageLimit) return { label: "Used up", tone: "warning" };
  return { label: "Active", tone: "success" };
}

export default function AdminCouponsPage() {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<Coupon | null>(null);
  const { data: coupons, isLoading } = useQuery({ queryKey: ["admin", "coupons"], queryFn: getCoupons });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCoupon(id),
    onSuccess: () => {
      toast.success("Coupon deleted");
      setDeleting(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
    onError: (err: unknown) => toast.error(errorMessage(err, "Could not delete coupon")),
  });

  return (
    <div className="grid gap-5">
      <AdminPageHeader title="Coupons" description="Discount codes customers can enter at checkout.">
        <Link href="/admin/coupons/new" className="action-primary min-h-11 rounded-xl px-4">
          <Plus className="size-4" aria-hidden />
          New coupon
        </Link>
      </AdminPageHeader>

      {isLoading || !coupons ? (
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      ) : coupons.length === 0 ? (
        <EmptyState icon={<Tag aria-hidden />} title="No coupons yet." />
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {coupons.map((c) => {
            const status = couponStatus(c);
            return (
              <li key={c._id} className="flex items-center gap-2 pe-2">
                <Link
                  href={`/admin/coupons/${c._id}`}
                  className="flex min-h-16 min-w-0 flex-1 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/60 sm:px-5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-base font-bold" data-i18n-ignore>
                        {c.code}
                      </span>
                      <StatusPill tone={status.tone}>{status.label}</StatusPill>
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {[
                        describeCoupon(c),
                        `${c.usedCount}${c.usageLimit ? ` / ${c.usageLimit}` : ""} used`,
                        c.endsAt ? `ends ${new Date(c.endsAt).toLocaleDateString("en-GB")}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
                <button
                  type="button"
                  onClick={() => setDeleting(c)}
                  className="grid size-11 shrink-0 place-items-center rounded-xl text-muted-foreground hover:bg-danger-soft hover:text-danger-strong"
                  aria-label="Delete coupon"
                >
                  <Trash2 className="size-4" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this coupon?"
        confirmLabel="Delete coupon"
        tone="danger"
        pending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting._id)}
      >
        <span data-i18n-ignore className="font-mono font-bold text-foreground">
          {deleting?.code}
        </span>{" "}
        <span>stops working straight away. This cannot be undone.</span>
      </ConfirmDialog>
    </div>
  );
}
