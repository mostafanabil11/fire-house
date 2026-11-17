"use client";

import { CouponForm } from "@/components/admin/coupon-form";
import { AdminPageHeader } from "@/components/admin/ui/page-header";
import { AdminBackLink } from "@/components/admin/ui/back-link";

export default function NewCouponPage() {
  return (
    <div className="grid gap-5">
      <div>
        <AdminBackLink href="/admin/coupons">Coupons</AdminBackLink>
        <AdminPageHeader title="New coupon" />
      </div>
      <CouponForm />
    </div>
  );
}
