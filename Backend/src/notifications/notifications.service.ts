import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@/config/config.service';
import { OrderDocument } from '@/orders/schemas/order.schema';
import {
  NotificationOutbox,
  NotificationOutboxDocument,
  NotificationEvent,
  DeliveryStatus,
} from './schemas/notification-outbox.schema';
import { WhatsAppProvider, WhatsAppSendError } from './whatsapp.provider';
import { buildNewOrderAlert, buildCancelledOrderAlert, OrderAlert } from './order-alert';
import { parseRecipients } from './phone.util';

// Five tries over roughly ten minutes. Past that a WhatsApp outage is no
// longer the reason the team has not seen the order — the dashboard is, and
// it has had the order since the moment it was placed.
const MAX_ATTEMPTS = 5;
const BACKOFF_MS = [30_000, 60_000, 120_000, 300_000];

const BATCH_SIZE = 20;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(NotificationOutbox.name)
    private outboxModel: Model<NotificationOutboxDocument>,
    private whatsapp: WhatsAppProvider,
    private configService: ConfigService
  ) {}

  private staffOrderUrl(orderNumber: string): string {
    return new URL(`/admin/orders/${orderNumber}`, this.configService.frontendUrl).toString();
  }

  /**
   * Records that the team should be told about an order. Deliberately never
   * throws: a notification is a side effect of an order, and an order that is
   * already paid for must not fail because a message could not be queued.
   */
  async enqueueOrderEvent(order: OrderDocument, event: NotificationEvent): Promise<void> {
    try {
      const recipients = parseRecipients(this.configService.whatsappRecipients);
      if (recipients.length === 0) {
        this.logger.warn(
          `No WHATSAPP_RECIPIENTS configured — ${order.orderNumber} (${event}) will not alert anyone`
        );
        return;
      }

      const url = this.staffOrderUrl(order.orderNumber);
      const alert: OrderAlert =
        event === 'order.cancelled'
          ? buildCancelledOrderAlert(order, url)
          : buildNewOrderAlert(order, url);

      // Unconfigured is recorded rather than dropped, so the restaurant can
      // see the alerts it would be getting before Meta onboarding finishes.
      const configured = this.whatsapp.isConfigured();

      await Promise.all(
        recipients.map(recipient =>
          this.outboxModel
            .create({
              event,
              order: order._id,
              orderNumber: order.orderNumber,
              recipient,
              status: configured ? 'pending' : 'skipped',
              body: alert.body,
              templateVariables: alert.templateVariables,
              idempotencyKey: `${String(order._id)}:${event}:${recipient}`,
            })
            .catch((err: { code?: number }) => {
              // 11000 is the unique index on idempotencyKey doing its job:
              // this exact alert is already queued or already sent.
              if (err?.code !== 11000) throw err;
            })
        )
      );
    } catch (err) {
      this.logger.error(
        `Could not queue ${event} alert for ${order.orderNumber}: ${(err as Error).message}`
      );
    }
  }

  /**
   * Sends everything that is due. Called by the scheduler, and safe to call
   * again at any time — each row is claimed before it is sent.
   */
  async processPending(): Promise<{ sent: number; failed: number }> {
    if (!this.whatsapp.isConfigured()) {
      return { sent: 0, failed: 0 };
    }

    const due = await this.outboxModel
      .find({ status: 'pending', nextAttemptAt: { $lte: new Date() } })
      .sort({ createdAt: 1 })
      .limit(BATCH_SIZE);

    let sent = 0;
    let failed = 0;

    for (const entry of due) {
      // Claim it first, matching on the attempt count we just read. A second
      // worker — or a manual retry racing the cron — reads the same count,
      // finds it already incremented, and moves on. Without this the team
      // gets the same order twice, which is how an order gets cooked twice.
      const claimed = await this.outboxModel.updateOne(
        { _id: entry._id, status: 'pending', attempts: entry.attempts },
        { $set: { nextAttemptAt: this.nextAttemptFor(entry.attempts) }, $inc: { attempts: 1 } }
      );
      if (claimed.modifiedCount !== 1) continue;

      try {
        const result = await this.whatsapp.send(entry.recipient, {
          body: entry.body,
          templateVariables: entry.templateVariables,
        });
        await this.outboxModel.updateOne(
          { _id: entry._id },
          {
            $set: {
              status: 'sent',
              sentAt: new Date(),
              providerMessageId: result.providerMessageId,
              lastError: null,
            },
          }
        );
        sent += 1;
      } catch (err) {
        const message = (err as Error).message;
        const permanent = err instanceof WhatsAppSendError && err.permanent;
        const exhausted = entry.attempts + 1 >= MAX_ATTEMPTS;

        await this.outboxModel.updateOne(
          { _id: entry._id },
          {
            $set: {
              status: permanent || exhausted ? 'failed' : 'pending',
              lastError: message.slice(0, 500),
            },
          }
        );
        failed += 1;
        this.logger.error(
          `WhatsApp alert for ${entry.orderNumber} to ${entry.recipient} failed` +
            `${permanent ? ' permanently' : ` (attempt ${entry.attempts + 1}/${MAX_ATTEMPTS})`}: ${message}`
        );
      }
    }

    return { sent, failed };
  }

  private nextAttemptFor(attemptsSoFar: number): Date {
    const delay = BACKOFF_MS[Math.min(attemptsSoFar, BACKOFF_MS.length - 1)];
    return new Date(Date.now() + delay);
  }

  /** The owner's notification-health view. */
  async list(limit = 50) {
    const entries = await this.outboxModel.find().sort({ createdAt: -1 }).limit(limit);
    return {
      success: true,
      message: 'Notifications retrieved successfully',
      data: entries,
      meta: {
        whatsappConfigured: this.whatsapp.isConfigured(),
        recipients: parseRecipients(this.configService.whatsappRecipients),
        usingTemplate: Boolean(this.configService.whatsappTemplateName),
      },
    };
  }

  /** Puts a failed or skipped alert back in the queue, due immediately. */
  async retry(id: string) {
    const entry = await this.outboxModel.findById(id);
    if (!entry) {
      throw new NotFoundException('Notification not found');
    }

    await this.outboxModel.updateOne(
      { _id: entry._id },
      { $set: { status: 'pending', attempts: 0, nextAttemptAt: new Date(), lastError: null } }
    );

    // Send it now rather than making the owner wait for the next sweep — they
    // are usually watching the screen when they press this.
    await this.processPending();

    return {
      success: true,
      message: 'Notification retried',
      data: await this.outboxModel.findById(entry._id),
    };
  }

  /**
   * Records what Meta says happened to a message we sent. This is metadata
   * about the alert and never touches the order: an undelivered notification
   * does not change what the kitchen is meant to cook.
   */
  async recordDeliveryStatus(providerMessageId: string, status: DeliveryStatus): Promise<void> {
    await this.outboxModel.updateOne({ providerMessageId }, { $set: { deliveryStatus: status } });
  }
}
