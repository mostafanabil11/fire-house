import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const updateSettingsSchema = z.object({
  currency: z.string().min(1).max(10).optional(),
  taxRateBasisPoints: z.number().int().min(0).max(10000).optional(),
  freeShippingThresholdMinorUnits: z.number().int().min(0).optional(),
  flatShippingRateMinorUnits: z.number().int().min(0).optional(),
  instapayAddress: z.string().trim().max(120).optional(),
});

export class UpdateSettingsDto extends createZodDto(updateSettingsSchema) {}
