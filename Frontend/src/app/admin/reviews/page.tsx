"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Star, Trash2, X } from "lucide-react";
import { getReviewsForModeration, moderateReview, deleteReview } from "@/lib/api/reviews";
import { StarRating } from "@/components/products/star-rating";
import type { Review, ReviewStatus } from "@/types/review";
import { errorMessage } from "@/lib/api/error-message";
import { AdminPageHeader } from "@/components/admin/ui/page-header";
import { Segmented } from "@/components/admin/ui/segmented";
import { StatusPill } from "@/components/admin/ui/status-pill";
import { EmptyState } from "@/components/admin/ui/empty-state";
import { ConfirmDialog } from "@/components/admin/ui/confirm-dialog";
import { T } from "@/i18n/language-provider";

type Tab = ReviewStatus | "all";

const TABS: { label: string; value: Tab }[] = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
  { label: "All", value: "all" },
];

const STATUS_TONE = { pending: "warning", approved: "success", rejected: "neutral" } as const;
const STATUS_LABEL = { pending: "Pending", approved: "Approved", rejected: "Rejected" } as const;

export default function AdminReviewsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("pending");
  const [deleting, setDeleting] = useState<Review | null>(null);

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["admin", "reviews", tab],
    queryFn: () => getReviewsForModeration(tab === "all" ? undefined : tab),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "reviews"] });

  const moderateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) => moderateReview(id, status),
    onSuccess: invalidate,
    onError: (err: unknown) => toast.error(errorMessage(err, "Could not update review")),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReview(id),
    onSuccess: () => {
      setDeleting(null);
      invalidate();
    },
    onError: (err: unknown) => toast.error(errorMessage(err, "Could not delete review")),
  });

  return (
    <div className="grid gap-5">
      <AdminPageHeader title="Reviews" description="Approve a review before customers can see it." />

      <Segmented label="Review status" value={tab} onChange={setTab} options={TABS} />

      {isLoading || !reviews ? (
        <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      ) : reviews.length === 0 ? (
        <EmptyState icon={<Star aria-hidden />} title="No reviews here." />
      ) : (
        <ul className="grid gap-3">
          {reviews.map((review) => {
            const product = typeof review.product === "object" ? review.product : null;
            return (
              <li key={review._id} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-base font-bold">
                      {product ? <T>{product.name}</T> : "Unknown dish"}
                    </p>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      <span data-i18n-ignore>
                        {review.user ? `${review.user.firstName} ${review.user.lastName}` : "—"}
                      </span>
                      <span aria-hidden> · </span>
                      {new Date(review.createdAt).toLocaleDateString("en-GB")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarRating value={review.rating} />
                    <StatusPill tone={STATUS_TONE[review.status]}>{STATUS_LABEL[review.status]}</StatusPill>
                  </div>
                </div>
                <div data-i18n-ignore className="mt-3">
                  {review.title && <p className="font-bold">{review.title}</p>}
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{review.body}</p>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {review.status !== "approved" && (
                    <button
                      type="button"
                      onClick={() => moderateMutation.mutate({ id: review._id, status: "approved" })}
                      disabled={moderateMutation.isPending}
                      className="action-primary min-h-11 rounded-xl px-4"
                    >
                      <Check className="size-4" aria-hidden />
                      Approve
                    </button>
                  )}
                  {review.status !== "rejected" && (
                    <button
                      type="button"
                      onClick={() => moderateMutation.mutate({ id: review._id, status: "rejected" })}
                      disabled={moderateMutation.isPending}
                      className="action-secondary min-h-11 rounded-xl px-4"
                    >
                      <X className="size-4" aria-hidden />
                      Reject
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeleting(review)}
                    className="ms-auto grid size-11 place-items-center rounded-xl text-muted-foreground hover:bg-danger-soft hover:text-danger-strong"
                    aria-label="Delete review"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this review?"
        confirmLabel="Delete review"
        tone="danger"
        pending={deleteMutation.isPending}
        onConfirm={() => deleting && deleteMutation.mutate(deleting._id)}
      >
        It is removed for good, including from the dish page. This cannot be undone.
      </ConfirmDialog>
    </div>
  );
}
