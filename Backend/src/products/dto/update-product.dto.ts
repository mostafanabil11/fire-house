import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { productBaseSchema, productConsistencyCheck } from './create-product.dto';

// Built from the plain field shapes, not from `createProductSchema`: Zod cannot
// call `.partial()` on a schema that already carries refinements. The
// cross-field rules are re-applied afterwards so an update is validated as
// strictly as a create.
export const updateProductSchema = productBaseSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  })
  .superRefine(productConsistencyCheck);

export class UpdateProductDto extends createZodDto(updateProductSchema) {}
