"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Star } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { getReviewsForProduct, createReview } from "@/lib/api/reviews";
import { StarRating } from "./star-rating";
import { errorMessage } from "@/lib/api/error-message";

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className="p-0.5"
        >
          <Star
            className={`size-6 ${n <= value ? "fill-foreground text-foreground" : "fill-none text-border"}`}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

export function ReviewsSection({ productId, averageRating, reviewCount }: { productId: string; averageRating: number; reviewCount: number }) {
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const { data: reviews, isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: () => getReviewsForProduct(productId),
  });

  const mutation = useMutation({
    mutationFn: () => createReview({ productId, rating, title, body }),
    onSuccess: () => {
      toast.success("Thanks — your review is awaiting approval");
      setShowForm(false);
      setTitle("");
      setBody("");
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ["reviews", productId] });
    },
    onError: (err: unknown) => {
      toast.error(errorMessage(err, "Could not submit review"));
    },
  });

  const inputClass =
    "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-foreground";

  return (
    <section className="mx-auto w-full max-w-(--spacing-container-max) border-t border-border px-margin-mobile py-stack-lg md:px-margin-desktop">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="mb-2 font-heading text-headline-sm font-bold text-foreground">Reviews</h2>
          {reviewCount > 0 ? (
            <div className="flex items-center gap-2">
              <StarRating value={averageRating} />
              <span className="text-[13px] text-muted-foreground">
                {averageRating.toFixed(1)} out of 5 ({reviewCount} review{reviewCount === 1 ? "" : "s"})
              </span>
            </div>
          ) : (
            <p className="text-[13px] text-muted-foreground">No reviews yet</p>
          )}
        </div>
        {user && !showForm && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="border border-foreground px-6 py-2.5 text-[12px] font-medium tracking-[0.05em] text-foreground uppercase hover:bg-foreground hover:text-background"
          >
            Write a Review
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
          className="mb-10 max-w-lg border border-border p-6"
        >
          <p className="mb-4 text-[12px] text-muted-foreground">
            Only customers who purchased this product can leave a review.
          </p>
          <div className="mb-4">
            <label className="mb-2 block text-[11px] font-semibold tracking-[0.1em] text-foreground uppercase">
              Rating
            </label>
            <StarInput value={rating} onChange={setRating} />
          </div>
          <div className="mb-4">
            <label className="mb-2 block text-[11px] font-semibold tracking-[0.1em] text-foreground uppercase">
              Title
            </label>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} maxLength={120} />
          </div>
          <div className="mb-4">
            <label className="mb-2 block text-[11px] font-semibold tracking-[0.1em] text-foreground uppercase">
              Review
            </label>
            <textarea required value={body} onChange={(e) => setBody(e.target.value)} rows={4} className={inputClass} maxLength={2000} />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="bg-primary px-6 py-2.5 text-[12px] font-medium tracking-[0.05em] text-primary-foreground uppercase hover:bg-primary/90 disabled:opacity-50"
            >
              {mutation.isPending ? "Submitting…" : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="border border-border px-6 py-2.5 text-[12px] uppercase hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="h-32 max-w-2xl animate-pulse bg-muted" />
      ) : !reviews || reviews.length === 0 ? (
        <p className="text-[13px] text-muted-foreground">Be the first to review this product.</p>
      ) : (
        <div className="max-w-2xl divide-y divide-border border-t border-b border-border">
          {reviews.map((review) => (
            <div key={review._id} className="py-5">
              <div className="mb-2 flex items-center justify-between gap-4">
                <StarRating value={review.rating} />
                <span className="text-[12px] text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </span>
              </div>
              <p className="mb-1 text-[14px] font-medium text-foreground">{review.title}</p>
              <p className="mb-2 text-[13px] text-muted-foreground">{review.body}</p>
              {review.user && (
                <p className="text-[12px] text-muted-foreground">— {review.user.firstName} {review.user.lastName.charAt(0)}.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
