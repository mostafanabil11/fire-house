export type ProductSize = "S" | "M" | "L" | "XL" | "2XL";

export interface ProductSizeStock {
  size: ProductSize;
  stock: number;
}

export interface MenuVariant {
  id: string;
  name: string;
  priceAdjustment: number;
  isDefault: boolean;
  isAvailable: boolean;
}

export interface MenuModifierOption {
  id: string;
  name: string;
  priceAdjustment: number;
  isAvailable: boolean;
}

export interface MenuModifierGroup {
  id: string;
  name: string;
  minSelections: number;
  maxSelections: number;
  options: MenuModifierOption[];
}

export interface ProductCategoryRef {
  _id: string;
  name: string;
  slug: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  styleGroup: string | null;
  category: ProductCategoryRef | string;
  price: number;
  discountPrice: number | null;
  images: string[];
  sizes: ProductSizeStock[];
  variants: MenuVariant[];
  modifierGroups: MenuModifierGroup[];
  dietaryTags: string[];
  allergens: string[];
  preparationTimeMinutes: number | null;
  isAvailable: boolean;
  trackInventory: boolean;
  stockQuantity: number | null;
  displayOrder: number;
  isBestSeller: boolean;
  isActive: boolean;
  averageRating: number;
  reviewCount: number;
}

export interface RelatedColorProduct {
  _id: string;
  name: string;
  slug: string;
  color: string;
  images: string[];
}

export interface RelatedProduct {
  _id: string;
  name: string;
  slug: string;
  color: string;
  images: string[];
  price: number;
  discountPrice: number | null;
}

export interface ProductDetail extends Product {
  relatedColors: RelatedColorProduct[];
  relatedProducts: RelatedProduct[];
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ProductListParams {
  category?: string;
  size?: ProductSize;
  color?: string;
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  sort?: "newest" | "price_asc" | "price_desc";
  q?: string;
  page?: number;
  limit?: number;
}
