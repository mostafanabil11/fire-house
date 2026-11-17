"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createCoupon, updateCoupon } from "@/lib/api/coupons";
import type { Coupon, CreateCouponInput } from "@/types/coupon";
import type { CouponType } from "@/lib/api/coupons";
import { errorMessage } from "@/lib/api/error-message";
import { Panel } from "@/components/admin/ui/panel";
import { CheckboxField, Field, inputClass } from "@/components/admin/ui/field";

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function CouponForm({ coupon }: { coupon?: Coupon }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!coupon;

  const [code, setCode] = useState(coupon?.code ?? "");
  const [type, setType] = useState<CouponType>(coupon?.type ?? "percentage");
  const [value, setValue] = useState(coupon ? String(coupon.type === "fixed" ? coupon.value / 100 : coupon.value) : "");
  const [minSubtotal, setMinSubtotal] = useState(coupon ? String(coupon.minSubtotal / 100) : "0");
  const [maxDiscountCap, setMaxDiscountCap] = useState(coupon?.maxDiscountCap ? String(coupon.maxDiscountCap / 100) : "");
  const [startsAt, setStartsAt] = useState(toDateInputValue(coupon?.startsAt ?? null));
  const [endsAt, setEndsAt] = useState(toDateInputValue(coupon?.endsAt ?? null));
  const [usageLimit, setUsageLimit] = useState(coupon?.usageLimit ? String(coupon.usageLimit) : "");
  const [excludeSaleItems, setExcludeSaleItems] = useState(coupon?.excludeSaleItems ?? false);
  const [isActive, setIsActive] = useState(coupon?.isActive ?? true);

  const mutation = useMutation({
    mutationFn: () => {
      const payload: Partial<CreateCouponInput> = {
        code: code.trim().toUpperCase(),
        type,
        value: type === "fixed" ? Math.round(parseFloat(value || "0") * 100) : Math.round(parseFloat(value || "0")),
        minSubtotal: Math.round(parseFloat(minSubtotal || "0") * 100),
        maxDiscountCap: maxDiscountCap.trim() ? Math.round(parseFloat(maxDiscountCap) * 100) : null,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        usageLimit: usageLimit.trim() ? parseInt(usageLimit, 10) : null,
        excludeSaleItems,
        isActive,
      };
      return isEdit ? updateCoupon(coupon._id, payload) : createCoupon(payload as CreateCouponInput);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      toast.success(isEdit ? "Coupon updated" : "Coupon created");
      router.push("/admin/coupons");
    },
    onError: (err: unknown) => toast.error(errorMessage(err, "Could not save coupon")),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="grid max-w-2xl gap-4"
    >
      <Panel title="Discount">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code" htmlFor="coupon-code">
            <input
              id="coupon-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className={`${inputClass} uppercase`}
            />
          </Field>
          <Field label="Type" htmlFor="coupon-type">
            <select
              id="coupon-type"
              value={type}
              onChange={(e) => setType(e.target.value as CouponType)}
              className={inputClass}
            >
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed amount</option>
              <option value="free_shipping">Free delivery</option>
            </select>
          </Field>
          {type !== "free_shipping" && (
            <Field
              label={type === "percentage" ? "Percentage off (1–100)" : "Amount off (EGP)"}
              htmlFor="coupon-value"
            >
              <input
                id="coupon-value"
                required
                type="number"
                inputMode="decimal"
                min={type === "percentage" ? 1 : 0.01}
                max={type === "percentage" ? 100 : undefined}
                step={type === "percentage" ? 1 : 0.01}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className={inputClass}
              />
            </Field>
          )}
          {type === "percentage" && (
            <Field label="Max discount (EGP, optional)" htmlFor="coupon-cap">
              <input
                id="coupon-cap"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={maxDiscountCap}
                onChange={(e) => setMaxDiscountCap(e.target.value)}
                className={inputClass}
              />
            </Field>
          )}
        </div>
      </Panel>

      <Panel title="Rules">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Minimum order (EGP)" htmlFor="coupon-min">
            <input
              id="coupon-min"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={minSubtotal}
              onChange={(e) => setMinSubtotal(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field
            label="Total uses (optional)"
            htmlFor="coupon-limit"
            hint="Each customer may use a coupon once, whatever this limit."
          >
            <input
              id="coupon-limit"
              type="number"
              inputMode="numeric"
              min="1"
              value={usageLimit}
              onChange={(e) => setUsageLimit(e.target.value)}
              placeholder="Unlimited"
              className={inputClass}
            />
          </Field>
          <Field label="Starts (optional)" htmlFor="coupon-starts">
            <input
              id="coupon-starts"
              type="date"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Ends (optional)" htmlFor="coupon-ends">
            <input
              id="coupon-ends"
              type="date"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <CheckboxField
            checked={excludeSaleItems}
            onChange={setExcludeSaleItems}
            label="Exclude discounted dishes"
          />
          {isEdit && <CheckboxField checked={isActive} onChange={setIsActive} label="Active" />}
        </div>
      </Panel>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row">
        <button
          type="button"
          onClick={() => router.push("/admin/coupons")}
          className="action-secondary min-h-12 rounded-xl px-8"
        >
          Cancel
        </button>
        <button type="submit" disabled={mutation.isPending} className="action-primary min-h-12 rounded-xl px-8">
          {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create coupon"}
        </button>
      </div>
    </form>
  );
}
