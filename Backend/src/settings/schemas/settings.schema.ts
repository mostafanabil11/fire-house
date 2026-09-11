import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SettingsDocument = HydratedDocument<Settings>;

// Singleton — exactly one document ever exists in this collection (see
// SettingsService.getSettings, which upserts against an empty filter).
@Schema({ timestamps: true })
export class Settings {
  @Prop({ default: 'EGP' })
  currency: string = 'EGP';

  // Integer basis points (1400 = 14.00%), not a float — same reasoning as
  // storing money in minor units: avoids rounding drift once this is
  // multiplied against order subtotals.
  @Prop({ default: 0, min: 0, max: 10000 })
  taxRateBasisPoints: number = 0;

  // Minor units (piastres), consistent with Product.price.
  @Prop({ default: 30000, min: 0 })
  freeShippingThresholdMinorUnits: number = 30000;

  // Charged when the order subtotal is under the free-shipping threshold.
  @Prop({ default: 5000, min: 0 })
  flatShippingRateMinorUnits: number = 5000;

  // The restaurant's InstaPay handle or mobile wallet number, shown to the
  // customer so they know where to send the transfer. Public by design — it
  // is a payee address, the same thing printed on a receipt. Empty disables
  // InstaPay as a checkout option.
  @Prop({ default: '', trim: true })
  instapayAddress: string = '';

  createdAt?: Date;
  updatedAt?: Date;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);
