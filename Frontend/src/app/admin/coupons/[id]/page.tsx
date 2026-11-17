"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getCoupon } from "@/lib/api/coupons";
import { CouponForm } from "@/components/admin/coupon-form";
import { AdminPageHeader } from "@/components/admin/ui/page-header";
import { AdminBackLink } from "@/components/admin/ui/back-link";

export default function EditCouponPage() {
  const params = useParams<{ id: string }>();
  const { data: coupon, isLoading } = useQuery({
    queryKey: ["admin", "coupons", params.id],
    queryFn: () => getCoupon(params.id),
  });

  return (
    <div className="grid gap-5">
      <div>
        <AdminBackLink href="/admin/coupons">Coupons</AdminBackLink>
        <AdminPageHeader title={coupon ? <span data-i18n-ignore>{coupon.code}</span> : "Edit coupon"} />
      </div>
      {isLoading || !coupon ? (
        <div className="h-96 max-w-2xl animate-pulse rounded-2xl bg-muted" />
      ) : (
        <CouponForm coupon={coupon} />
      )}
    </div>
  );
}
