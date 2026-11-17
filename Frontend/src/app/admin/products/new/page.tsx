"use client";

import { ProductForm } from "@/components/admin/product-form";
import { AdminPageHeader } from "@/components/admin/ui/page-header";
import { AdminBackLink } from "@/components/admin/ui/back-link";

export default function NewProductPage() {
  return (
    <div className="grid gap-5">
      <div>
        <AdminBackLink href="/admin/products">Menu</AdminBackLink>
        <AdminPageHeader title="New dish" />
      </div>
      <ProductForm />
    </div>
  );
}
