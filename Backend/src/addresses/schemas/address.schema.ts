import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types, HydratedDocument } from 'mongoose';

export const EGYPT_GOVERNORATES = [
  'Cairo', 'Giza', 'Alexandria', 'Qalyubia', 'Port Said', 'Suez', 'Dakahlia',
  'Sharqia', 'Gharbia', 'Monufia', 'Beheira', 'Ismailia', 'Faiyum', 'Beni Suef',
  'Minya', 'Asyut', 'Sohag', 'Qena', 'Luxor', 'Aswan', 'Red Sea', 'New Valley',
  'Matrouh', 'North Sinai', 'South Sinai', 'Kafr El Sheikh', 'Damietta',
] as const;
export type EgyptGovernorate = (typeof EGYPT_GOVERNORATES)[number];

export type AddressDocument = HydratedDocument<Address>;

@Schema({ timestamps: true })
export class Address {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  user!: Types.ObjectId;

  // Recipient name — kept separate from the account holder's name since the
  // person receiving a delivery isn't always the account owner.
  @Prop({ required: true, trim: true })
  firstName: string = '';

  @Prop({ required: true, trim: true })
  lastName: string = '';

  @Prop({ required: true, trim: true })
  phone: string = '';

  @Prop({ required: true, trim: true })
  addressLine: string = '';

  // Optional: the address line is the whole address for a local delivery.
  // Kept so addresses saved before that change still show their area.
  @Prop({ trim: true, default: '' })
  city: string = '';

  @Prop({ type: String, enum: [...EGYPT_GOVERNORATES, null], default: null })
  governorate: EgyptGovernorate | null = null;

  @Prop({ type: String, default: null, trim: true })
  postalCode: string | null = null;

  @Prop({ default: false })
  isDefault: boolean = false;

  createdAt?: Date;
  updatedAt?: Date;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

AddressSchema.index({ user: 1 });
