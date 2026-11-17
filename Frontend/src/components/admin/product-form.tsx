"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";
import { createProduct, updateProduct, type ProductInput } from "@/lib/api/products";
import { getAdminCategoryTree } from "@/lib/api/categories";
import type { Product, ProductSize } from "@/types/product";
import type { Category } from "@/types/category";
import { errorMessage } from "@/lib/api/error-message";
import { Panel } from "@/components/admin/ui/panel";
import { CheckboxField, Field, inputClass } from "@/components/admin/ui/field";

const ALL_SIZES: ProductSize[] = ["S", "M", "L", "XL", "2XL"];

// Product category must be a subcategory (e.g. "Men > Hoodies"), never a
// top-level category — enforced server-side too (ProductsService.create).
function flattenAssignableCategories(tree: Category[]): { id: string; label: string }[] {
  const result: { id: string; label: string }[] = [];
  for (const parent of tree) {
    for (const child of parent.children ?? []) {
      result.push({ id: child._id, label: `${parent.name} > ${child.name}` });
    }
  }
  return result;
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!product;

  const categoriesQuery = useQuery({ queryKey: ["admin", "categories", "tree"], queryFn: getAdminCategoryTree });
  const assignableCategories = flattenAssignableCategories(categoriesQuery.data ?? []);

  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [color, setColor] = useState(product?.color ?? "");
  const [styleGroup, setStyleGroup] = useState(product?.styleGroup ?? "");
  const [category, setCategory] = useState(
    typeof product?.category === "string" ? product.category : (product?.category?._id ?? ""),
  );
  const [priceMajor, setPriceMajor] = useState(product ? String(product.price / 100) : "");
  const [discountPriceMajor, setDiscountPriceMajor] = useState(
    product?.discountPrice ? String(product.discountPrice / 100) : "",
  );
  const [images, setImages] = useState<string[]>(product?.images ?? [""]);
  const [sizes, setSizes] = useState<Record<ProductSize, number>>(() => {
    const base: Record<ProductSize, number> = { S: 0, M: 0, L: 0, XL: 0, "2XL": 0 };
    product?.sizes.forEach((s) => {
      base[s.size] = s.stock;
    });
    return base;
  });
  const [isBestSeller, setIsBestSeller] = useState(product?.isBestSeller ?? false);
  const [isActive, setIsActive] = useState(product?.isActive ?? true);

  const mutation = useMutation({
    mutationFn: () => {
      const payload: ProductInput = {
        name,
        description: description.trim() || null,
        color,
        styleGroup: styleGroup.trim() || null,
        category,
        price: Math.round(parseFloat(priceMajor || "0") * 100),
        discountPrice: discountPriceMajor.trim() ? Math.round(parseFloat(discountPriceMajor) * 100) : null,
        images: images.map((i) => i.trim()).filter(Boolean),
        sizes: ALL_SIZES.map((size) => ({ size, stock: sizes[size] })),
        isBestSeller,
      };
      return isEdit ? updateProduct(product._id, { ...payload, isActive }) : createProduct(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success(isEdit ? "Dish updated" : "Dish created");
      router.push("/admin/products");
    },
    onError: (err: unknown) => {
      toast.error(errorMessage(err, "Could not save dish"));
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
      className="grid max-w-3xl gap-4"
    >
      <Panel title="Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="product-name">
            <input id="product-name" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Color" htmlFor="product-color">
            <input id="product-color" required value={color} onChange={(e) => setColor(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Description" htmlFor="product-description" className="sm:col-span-2">
            <textarea
              id="product-description"
              value={description ?? ""}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={inputClass}
            />
          </Field>
          <Field label="Section" htmlFor="product-category">
            <select
              id="product-category"
              required
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputClass}
            >
              <option value="" disabled>
                Select a subcategory…
              </option>
              {assignableCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field
            label="Style group (optional)"
            htmlFor="product-style-group"
            hint="Shared key linking colorways of the same style."
          >
            <input
              id="product-style-group"
              value={styleGroup ?? ""}
              onChange={(e) => setStyleGroup(e.target.value)}
              placeholder="e.g. knitted-polo-t-shirt"
              className={inputClass}
            />
          </Field>
        </div>
      </Panel>

      <Panel title="Price">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price (EGP)" htmlFor="product-price">
            <input
              id="product-price"
              required
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={priceMajor}
              onChange={(e) => setPriceMajor(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Discount price (EGP, optional)" htmlFor="product-discount">
            <input
              id="product-discount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={discountPriceMajor}
              onChange={(e) => setDiscountPriceMajor(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
      </Panel>

      <Panel title="Photos">
        <div className="grid gap-2">
          {images.map((url, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={url}
                onChange={(e) => setImages((prev) => prev.map((u, idx) => (idx === i ? e.target.value : u)))}
                placeholder="https://…"
                aria-label="Image URL"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                disabled={images.length === 1}
                className="grid size-12 shrink-0 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-danger-strong disabled:opacity-30"
                aria-label="Remove image"
              >
                <Trash2 className="size-4" strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setImages((prev) => [...prev, ""])}
          className="action-secondary mt-3 min-h-11 rounded-xl px-4"
        >
          <Plus className="size-4" strokeWidth={2} />
          Add image URL
        </button>
      </Panel>

      <Panel title="Stock by size">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {ALL_SIZES.map((size) => (
            <Field key={size} label={size} htmlFor={`stock-${size}`}>
              <input
                id={`stock-${size}`}
                type="number"
                inputMode="numeric"
                min="0"
                value={sizes[size]}
                onChange={(e) =>
                  setSizes((prev) => ({ ...prev, [size]: Math.max(0, parseInt(e.target.value || "0", 10)) }))
                }
                className={`${inputClass} text-center`}
              />
            </Field>
          ))}
        </div>
      </Panel>

      <Panel title="Visibility">
        <div className="grid gap-2 sm:grid-cols-2">
          <CheckboxField checked={isBestSeller} onChange={setIsBestSeller} label="Best seller" />
          {isEdit && (
            <CheckboxField
              checked={isActive}
              onChange={setIsActive}
              label="Shown on the menu"
              hint="Untick to hide this dish from customers."
            />
          )}
        </div>
      </Panel>

      <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row">
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="action-secondary min-h-12 rounded-xl px-8"
        >
          Cancel
        </button>
        <button type="submit" disabled={mutation.isPending} className="action-primary min-h-12 rounded-xl px-8">
          {mutation.isPending ? "Saving…" : isEdit ? "Save changes" : "Create dish"}
        </button>
      </div>
    </form>
  );
}
