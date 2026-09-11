import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export const DIETARY_TAGS = ['vegetarian', 'vegan', 'spicy', 'gluten_free', 'halal'] as const;
export type DietaryTag = (typeof DIETARY_TAGS)[number];

@Schema({ _id: false })
export class MenuVariant {
  @Prop({ required: true, trim: true, lowercase: true })
  id: string = '';

  @Prop({ required: true, trim: true })
  name: string = '';

  @Prop({ required: true, default: 0 })
  priceAdjustment: number = 0;

  @Prop({ default: false })
  isDefault: boolean = false;

  @Prop({ default: true })
  isAvailable: boolean = true;
}

export const MenuVariantSchema = SchemaFactory.createForClass(MenuVariant);

@Schema({ _id: false })
export class MenuModifierOption {
  @Prop({ required: true, trim: true, lowercase: true })
  id: string = '';

  @Prop({ required: true, trim: true })
  name: string = '';

  @Prop({ required: true, default: 0 })
  priceAdjustment: number = 0;

  @Prop({ default: true })
  isAvailable: boolean = true;
}

export const MenuModifierOptionSchema = SchemaFactory.createForClass(MenuModifierOption);

@Schema({ _id: false })
export class MenuModifierGroup {
  @Prop({ required: true, trim: true, lowercase: true })
  id: string = '';

  @Prop({ required: true, trim: true })
  name: string = '';

  @Prop({ required: true, min: 0, default: 0 })
  minSelections: number = 0;

  @Prop({ required: true, min: 1, default: 1 })
  maxSelections: number = 1;

  @Prop({ type: [MenuModifierOptionSchema], default: [] })
  options: MenuModifierOption[] = [];
}

export const MenuModifierGroupSchema = SchemaFactory.createForClass(MenuModifierGroup);
