import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const updateOrderStatusSchema = z
  .object({
    fulfillmentStatus: z.enum(['confirmed', 'shipped', 'delivered']).optional(),
    // 'paid' is how staff confirm an InstaPay transfer actually landed;
    // card orders reach 'paid' through the provider webhook and COD orders
    // on delivery, so neither needs it set by hand.
    paymentStatus: z.enum(['paid', 'refunded']).optional(),
    trackingNumber: z.string().max(100).optional(),
  })
  .refine((data) => data.fulfillmentStatus || data.paymentStatus, {
    message: 'Provide a fulfillmentStatus or paymentStatus to update',
  });

export class UpdateOrderStatusDto extends createZodDto(updateOrderStatusSchema) {}
