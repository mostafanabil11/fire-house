import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types, HydratedDocument } from 'mongoose';

export type NotificationOutboxDocument = HydratedDocument<NotificationOutbox>;

export const NOTIFICATION_EVENTS = ['order.new', 'order.cancelled'] as const;
export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];

// 'skipped' is not a failure: it is what happens when WhatsApp has not been
// connected yet. The message is still rendered and stored, so the restaurant
// can see exactly what their team would have received, and so switching the
// credentials on later needs no other change.
export const NOTIFICATION_STATUSES = ['pending', 'sent', 'failed', 'skipped'] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

// Reported back by Meta's webhook after the fact. This is metadata about the
// message, never about the order — an undelivered alert does not change what
// the kitchen is supposed to cook.
export const DELIVERY_STATUSES = ['sent', 'delivered', 'read', 'failed'] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

@Schema({ timestamps: true })
export class NotificationOutbox {
  @Prop({ required: true, enum: NOTIFICATION_EVENTS })
  event: NotificationEvent = 'order.new';

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Order', required: true })
  order!: Types.ObjectId;

  // Denormalised so the owner's notification-health screen can name the order
  // without a join, and so the row still means something if the order is ever
  // removed.
  @Prop({ required: true })
  orderNumber!: string;

  // E.164 without the leading '+', which is the format the Cloud API wants.
  @Prop({ required: true })
  recipient!: string;

  @Prop({ required: true, enum: NOTIFICATION_STATUSES, default: 'pending' })
  status: NotificationStatus = 'pending';

  // The exact text the team is meant to read. Kept even when the message is
  // sent as a template, because the template renders to this and the owner
  // should not have to reconstruct it from variables.
  @Prop({ required: true })
  body!: string;

  // Positional variables for the approved WhatsApp template, in order. Stored
  // rather than re-derived so a retry days later sends what the customer
  // actually ordered, not what the order looks like now.
  @Prop({ type: [String], default: [] })
  templateVariables: string[] = [];

  @Prop({ default: 0 })
  attempts: number = 0;

  @Prop({ type: Date, default: () => new Date() })
  nextAttemptAt: Date = new Date();

  @Prop({ type: String, default: null })
  providerMessageId: string | null = null;

  @Prop({ type: String, default: null, enum: [...DELIVERY_STATUSES, null] })
  deliveryStatus: DeliveryStatus | null = null;

  @Prop({ type: String, default: null })
  lastError: string | null = null;

  @Prop({ type: Date, default: null })
  sentAt: Date | null = null;

  // `${orderId}:${event}:${recipient}`. Unique, so a retried checkout or a
  // replayed event can never queue the same alert twice — the team seeing one
  // order twice is how they end up cooking it twice.
  @Prop({ required: true, unique: true })
  idempotencyKey!: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const NotificationOutboxSchema = SchemaFactory.createForClass(NotificationOutbox);

// The worker's only query: due, still pending, oldest first.
NotificationOutboxSchema.index({ status: 1, nextAttemptAt: 1 });
// The owner's health screen: newest first.
NotificationOutboxSchema.index({ createdAt: -1 });
