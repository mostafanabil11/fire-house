import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { Product, ProductDocument } from '@/products/schemas/product.schema';
import { ProductSize } from '@/products/schemas/product-size-stock.schema';
import { CartItemDto } from './dto';
import {
  buildCartLineKey,
  normalizeCartNote,
  resolveMenuCustomization,
  ResolvedModifier,
} from './cart-line.util';

export interface RawCartLine {
  productId: string;
  size?: ProductSize | null;
  variantId?: string | null;
  modifierOptionIds?: string[];
  note?: string | null;
  quantity: number;
}

export interface ResolvedCartLine {
  lineKey: string;
  productId: string;
  size: ProductSize | null;
  variant: { id: string; name: string; priceAdjustment: number } | null;
  modifiers: ResolvedModifier[];
  note: string | null;
  available: boolean;
  reason:
    | 'ok'
    | 'invalid_product'
    | 'not_found'
    | 'inactive'
    | 'unavailable'
    | 'out_of_stock'
    | 'invalid_customization';
  customizationError: string | null;
  requestedQuantity: number;
  quantity: number;
  availableStock: number | null;
  unitPrice: number | null;
  lineTotal: number;
  name: string | null;
  slug: string | null;
  color: string | null;
  image: string | null;
  categoryId: string | null;
  onSale: boolean;
}

export interface ResolvedCart {
  items: ResolvedCartLine[];
  subtotal: number;
  hasChanges: boolean;
}

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>
  ) {}

  // Single source of truth for menu availability and pricing. The client
  // sends only choices; base price and every adjustment are re-read here.
  async resolveItems(rawItems: RawCartLine[]): Promise<ResolvedCart> {
    const results: ResolvedCartLine[] = [];
    let subtotal = 0;
    let hasChanges = false;

    for (const item of rawItems) {
      const note = normalizeCartNote(item.note);
      const lineKey = buildCartLineKey({ ...item, note });
      const empty = {
        lineKey,
        productId: item.productId,
        size: item.size ?? null,
        variant: null,
        modifiers: [],
        note,
        customizationError: null,
        requestedQuantity: item.quantity,
        quantity: 0,
        availableStock: null,
        unitPrice: null,
        lineTotal: 0,
        name: null,
        slug: null,
        color: null,
        image: null,
        categoryId: null,
        onSale: false,
      } satisfies Omit<ResolvedCartLine, 'available' | 'reason'>;

      if (!Types.ObjectId.isValid(item.productId)) {
        results.push({ ...empty, available: false, reason: 'invalid_product' });
        hasChanges = true;
        continue;
      }

      const product = await this.productModel.findById(item.productId);
      if (!product) {
        results.push({ ...empty, available: false, reason: 'not_found' });
        hasChanges = true;
        continue;
      }

      const display = {
        name: product.name,
        slug: product.slug,
        color: product.color,
        image: product.images[0] ?? null,
        categoryId: product.category.toString(),
        onSale: product.discountPrice !== null,
      };

      if (!product.isActive) {
        results.push({ ...empty, ...display, available: false, reason: 'inactive' });
        hasChanges = true;
        continue;
      }
      if (!product.isAvailable) {
        results.push({ ...empty, ...display, available: false, reason: 'unavailable' });
        hasChanges = true;
        continue;
      }

      const customization = resolveMenuCustomization(
        product.variants,
        product.modifierGroups,
        item
      );
      if (!customization.valid) {
        results.push({
          ...empty,
          ...display,
          available: false,
          reason: 'invalid_customization',
          customizationError: customization.message,
        });
        hasChanges = true;
        continue;
      }

      let availableStock: number | null = null;
      if (product.trackInventory) {
        availableStock = product.stockQuantity ?? 0;
      } else if (product.sizes.length > 0) {
        availableStock = product.sizes.find(candidate => candidate.size === item.size)?.stock ?? 0;
      }

      if (availableStock !== null && availableStock <= 0) {
        results.push({
          ...empty,
          ...display,
          availableStock,
          available: false,
          reason: 'out_of_stock',
        });
        hasChanges = true;
        continue;
      }

      const quantity =
        availableStock === null ? item.quantity : Math.min(item.quantity, availableStock);
      if (quantity !== item.quantity) hasChanges = true;

      const unitPrice = (product.discountPrice ?? product.price) + customization.priceAdjustment;
      const lineTotal = unitPrice * quantity;
      subtotal += lineTotal;

      results.push({
        ...empty,
        ...display,
        productId: product._id.toString(),
        variant: customization.variant
          ? {
              id: customization.variant.id,
              name: customization.variant.name,
              priceAdjustment: customization.variant.priceAdjustment,
            }
          : null,
        modifiers: customization.modifiers,
        available: true,
        reason: 'ok',
        quantity,
        availableStock,
        unitPrice,
        lineTotal,
      });
    }

    return { items: results, subtotal, hasChanges };
  }

  async validate(rawItems: RawCartLine[]) {
    const resolved = await this.resolveItems(rawItems);
    return { success: true, message: 'Cart validated', data: resolved };
  }

  private async getOrCreateCart(userId: string): Promise<CartDocument> {
    let cart = await this.cartModel.findOne({ user: userId });
    if (!cart) cart = await this.cartModel.create({ user: userId, items: [] });
    return cart;
  }

  private toRawItems(cart: CartDocument): RawCartLine[] {
    return cart.items.map(item => ({
      productId: item.product.toString(),
      size: item.size,
      variantId: item.variantId,
      modifierOptionIds: item.modifierOptionIds,
      note: item.note,
      quantity: item.quantity,
    }));
  }

  async getCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);
    const resolved = await this.resolveItems(this.toRawItems(cart));
    return { success: true, message: 'Cart retrieved successfully', data: resolved };
  }

  async addItem(userId: string, dto: CartItemDto) {
    const cart = await this.getOrCreateCart(userId);
    const note = normalizeCartNote(dto.note);
    const lineKey = buildCartLineKey({ ...dto, note });
    const existing = cart.items.find(item => {
      const existingKey =
        item.lineKey ??
        buildCartLineKey({
          productId: item.product.toString(),
          variantId: item.variantId,
          modifierOptionIds: item.modifierOptionIds,
          note: item.note,
        });
      return existingKey === lineKey;
    });

    if (existing) {
      existing.quantity += dto.quantity;
      existing.lineKey = lineKey;
    } else {
      cart.items.push({
        product: new Types.ObjectId(dto.productId),
        size: dto.size ?? null,
        variantId: dto.variantId ?? null,
        modifierOptionIds: dto.modifierOptionIds,
        note,
        lineKey,
        quantity: dto.quantity,
      });
    }

    cart.abandonedEmailSentAt = null;
    await cart.save();
    const resolved = await this.resolveItems(this.toRawItems(cart));
    return { success: true, message: 'Item added to cart', data: resolved };
  }

  async updateLine(userId: string, lineKey: string, quantity: number) {
    const cart = await this.getOrCreateCart(userId);
    const index = cart.items.findIndex(item => item.lineKey === lineKey);
    if (index !== -1) {
      if (quantity <= 0) cart.items.splice(index, 1);
      else cart.items[index].quantity = quantity;
      cart.abandonedEmailSentAt = null;
      await cart.save();
    }
    const resolved = await this.resolveItems(this.toRawItems(cart));
    return { success: true, message: 'Cart updated', data: resolved };
  }

  // Temporary compatibility path for existing catalog clients. New restaurant
  // screens update by lineKey so two customized versions never collide.
  async updateItem(userId: string, productId: string, size: ProductSize, quantity: number) {
    const cart = await this.getOrCreateCart(userId);
    const index = cart.items.findIndex(
      item => item.product.toString() === productId && item.size === size
    );
    if (index !== -1) {
      if (quantity <= 0) cart.items.splice(index, 1);
      else cart.items[index].quantity = quantity;
      cart.abandonedEmailSentAt = null;
      await cart.save();
    }
    const resolved = await this.resolveItems(this.toRawItems(cart));
    return { success: true, message: 'Cart updated', data: resolved };
  }

  async removeItem(userId: string, productId: string, size: ProductSize) {
    return this.updateItem(userId, productId, size, 0);
  }

  async clear(userId: string) {
    await this.cartModel.updateOne({ user: userId }, { $set: { items: [] } }, { upsert: true });
    return { success: true, message: 'Cart cleared', data: null };
  }

  async clearInternal(userId: string): Promise<void> {
    await this.cartModel.updateOne({ user: userId }, { $set: { items: [] } });
  }

  async findAbandoned(staleAfterMs: number): Promise<CartDocument[]> {
    return this.cartModel
      .find({
        'items.0': { $exists: true },
        abandonedEmailSentAt: null,
        updatedAt: { $lt: new Date(Date.now() - staleAfterMs) },
      })
      .populate('user', 'email firstName');
  }

  async markAbandonedEmailSent(cartId: Types.ObjectId): Promise<void> {
    await this.cartModel.updateOne({ _id: cartId }, { $set: { abandonedEmailSentAt: new Date() } });
  }
}
