import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { PAYMENT_STATUSES } from '../schemas/order.schema';
import { FULFILLMENT_STATUSES } from '../schemas/order.schema';

// The staff board groups several fulfilment statuses under one tab — "needs
// action" is unfulfilled *and* processing — so this accepts a comma-separated
// list rather than making the dashboard fire one request per status and stitch
// the pages back together itself.
const fulfillmentStatusList = z
  .string()
  .transform(value => value.split(',').map(part => part.trim()).filter(Boolean))
  .pipe(z.array(z.enum(FULFILLMENT_STATUSES)).min(1).max(FULFILLMENT_STATUSES.length));

export const adminOrderQuerySchema = z.object({
  paymentStatus: z.enum(PAYMENT_STATUSES).optional(),
  fulfillmentStatus: fulfillmentStatusList.optional(),
  // Free-text match on order number, customer name or phone — what a staff
  // member has in front of them when a customer calls about an order.
  q: z.string().trim().min(1).max(100).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export class AdminOrderQueryDto extends createZodDto(adminOrderQuerySchema) {}
