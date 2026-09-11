import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PRODUCT_SIZES } from '@/products/schemas/product-size-stock.schema';

export const cartItemSchema = z
  .object({
    productId: z.string().min(1, 'Product id is required'),
    // `size` is accepted temporarily while existing catalog records migrate.
    // Restaurant menu items use variantId + modifierOptionIds instead.
    size: z.enum(PRODUCT_SIZES).optional().nullable(),
    variantId: z.string().trim().min(1).max(50).optional().nullable(),
    modifierOptionIds: z.array(z.string().trim().min(1).max(50)).max(40).optional().default([]),
    note: z.string().trim().max(300).optional().nullable(),
    quantity: z.number().int().positive('Quantity must be at least 1'),
  })
  .superRefine((data, ctx) => {
    if (new Set(data.modifierOptionIds).size !== data.modifierOptionIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['modifierOptionIds'],
        message: 'Modifier options must be unique',
      });
    }
  });

export class CartItemDto extends createZodDto(cartItemSchema) {}

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(0, 'Quantity cannot be negative'),
});

export class UpdateCartItemDto extends createZodDto(updateCartItemSchema) {}
