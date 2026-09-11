import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';
import { EGYPT_GOVERNORATES } from '../schemas/address.schema';

export const createAddressSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().min(6, 'Please provide a valid phone number').max(30),
  addressLine: z.string().min(1, 'Address is required').max(300),
  // Checkout asks for the address line alone now. These remain accepted so
  // existing clients and saved addresses keep working, but nothing requires them.
  city: z.string().trim().max(100).optional(),
  governorate: z.enum(EGYPT_GOVERNORATES).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  isDefault: z.boolean().optional(),
});

export class CreateAddressDto extends createZodDto(createAddressSchema) {}
