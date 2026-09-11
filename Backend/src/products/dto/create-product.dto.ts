import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PRODUCT_SIZES } from '../schemas/product-size-stock.schema';
import { DIETARY_TAGS } from '../schemas/menu-option.schema';

const sizeEnum = z.enum(PRODUCT_SIZES);

// The field shapes on their own. Kept separate from the cross-field rules
// below so `update` can call `.partial()` on it — Zod refuses `.partial()` on a
// schema that already carries refinements, which crashed the app at boot.
export const productBaseSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(150),
    description: z.string().max(2000).optional().nullable(),
    color: z.string().min(1).max(50).optional().nullable(),
    styleGroup: z.string().max(150).optional().nullable(),
    category: z.string().min(1, 'Category is required'),
    // Minor units (piastres — 1 EGP = 100), always an integer, so money never
    // touches floating-point arithmetic on the way in.
    price: z
      .number()
      .int('Price must be a whole number of minor units (e.g. piastres)')
      .positive('Price must be greater than 0'),
    discountPrice: z
      .number()
      .int('Discount price must be a whole number of minor units')
      .positive()
      .optional()
      .nullable(),
    images: z.array(z.string()).min(1, 'At least one image is required'),
    sizes: z
      .array(
        z.object({
          size: sizeEnum,
          stock: z.number().int().min(0),
        })
      )
      .optional()
      .default([]),
    variants: z
      .array(
        z.object({
          id: z
            .string()
            .trim()
            .min(1)
            .max(50)
            .regex(/^[a-z0-9_-]+$/),
          name: z.string().trim().min(1).max(80),
          priceAdjustment: z.number().int().min(0).default(0),
          isDefault: z.boolean().default(false),
          isAvailable: z.boolean().default(true),
        })
      )
      .max(20)
      .optional()
      .default([]),
    modifierGroups: z
      .array(
        z.object({
          id: z
            .string()
            .trim()
            .min(1)
            .max(50)
            .regex(/^[a-z0-9_-]+$/),
          name: z.string().trim().min(1).max(80),
          minSelections: z.number().int().min(0).default(0),
          maxSelections: z.number().int().min(1).max(20).default(1),
          options: z
            .array(
              z.object({
                id: z
                  .string()
                  .trim()
                  .min(1)
                  .max(50)
                  .regex(/^[a-z0-9_-]+$/),
                name: z.string().trim().min(1).max(80),
                priceAdjustment: z.number().int().min(0).default(0),
                isAvailable: z.boolean().default(true),
              })
            )
            .min(1)
            .max(50),
        })
      )
      .max(20)
      .optional()
      .default([]),
    dietaryTags: z.array(z.enum(DIETARY_TAGS)).max(DIETARY_TAGS.length).optional().default([]),
    allergens: z.array(z.string().trim().min(1).max(80)).max(30).optional().default([]),
    preparationTimeMinutes: z.number().int().min(1).max(240).optional().nullable(),
    isAvailable: z.boolean().optional(),
    trackInventory: z.boolean().optional(),
    stockQuantity: z.number().int().min(0).optional().nullable(),
    displayOrder: z.number().int().optional(),
    isBestSeller: z.boolean().optional(),
  });

type ProductShape = Partial<z.infer<typeof productBaseSchema>>;

// Cross-field rules shared by create and update. Every field is read
// defensively because an update payload only carries what actually changed.
const checkProductConsistency = (data: ProductShape, ctx: z.RefinementCtx): void => {
  const variants = data.variants ?? [];
  const modifierGroups = data.modifierGroups ?? [];
  const variantIds = variants.map(variant => variant.id);
  if (new Set(variantIds).size !== variantIds.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['variants'],
      message: 'Variant ids must be unique',
    });
  }
  if (variants.filter(variant => variant.isDefault).length > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['variants'],
      message: 'Only one variant can be the default',
    });
  }

  const groupIds = modifierGroups.map(group => group.id);
  if (new Set(groupIds).size !== groupIds.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['modifierGroups'],
      message: 'Modifier group ids must be unique',
    });
  }

  modifierGroups.forEach((group, groupIndex) => {
    if (group.minSelections > group.maxSelections || group.maxSelections > group.options.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['modifierGroups', groupIndex],
        message: 'Modifier selection limits must fit the available options',
      });
    }
    const optionIds = group.options.map(option => option.id);
    if (new Set(optionIds).size !== optionIds.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['modifierGroups', groupIndex, 'options'],
        message: 'Modifier option ids must be unique within a group',
      });
    }
  });

  if (data.trackInventory === true && data.stockQuantity == null) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['stockQuantity'],
      message: 'Stock quantity is required when inventory tracking is enabled',
    });
  }
};

export const createProductSchema = productBaseSchema.superRefine(checkProductConsistency);

export const productConsistencyCheck = checkProductConsistency;

export class CreateProductDto extends createZodDto(createProductSchema) {}
