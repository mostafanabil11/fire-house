import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { NotificationsService } from './notifications.service';

@Injectable()
export class NotificationsScheduler {
  private readonly logger = new Logger(NotificationsScheduler.name);
  // A slow WhatsApp call must not let the next tick start a second sweep over
  // the same rows.
  private running = false;

  constructor(private notificationsService: NotificationsService) {}

  // Every 30 seconds. The alert is a nudge towards a dashboard that already
  // has the order, so half a minute of latency costs nothing — and this runs
  // inside the existing app process rather than needing a queue to operate.
  @Cron(CronExpression.EVERY_30_SECONDS)
  async flushOutbox() {
    if (this.running) return;
    this.running = true;

    try {
      const { sent, failed } = await this.notificationsService.processPending();
      if (sent > 0 || failed > 0) {
        this.logger.log(`WhatsApp alerts — sent ${sent}, failed ${failed}`);
      }
    } catch (err) {
      this.logger.error(`Notification sweep failed: ${(err as Error).message}`);
    } finally {
      this.running = false;
    }
  }
}


