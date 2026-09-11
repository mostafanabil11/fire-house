import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  Res,
  HttpCode,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { NotificationsService } from './notifications.service';
import { ConfigService } from '@/config/config.service';
import { Public } from '@/auth/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { DeliveryStatus, DELIVERY_STATUSES } from './schemas/notification-outbox.schema';

// The shape Meta posts to the webhook. Only the fields we act on are typed —
// the payload carries a lot more, and none of it should be trusted.
interface MetaWebhookBody {
  entry?: {
    changes?: {
      value?: {
        statuses?: { id?: string; status?: string }[];
      };
    }[];
  }[];
}

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(
    private notificationsService: NotificationsService,
    private configService: ConfigService
  ) {}

  @Roles('admin')
  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Recent order alerts and whether WhatsApp is connected (admin only)' })
  async list(@Query('limit') limit?: string) {
    const parsed = Number(limit);
    return this.notificationsService.list(
      Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 200) : 50
    );
  }

  @Roles('admin')
  @ApiBearerAuth()
  @Post(':id/retry')
  @ApiOperation({ summary: 'Send a failed or skipped order alert again (admin only)' })
  async retry(@Param('id') id: string) {
    return this.notificationsService.retry(id);
  }

  // --- Meta Cloud API webhook ---
  //
  // Public because Meta calls it with no session. It only ever records what
  // happened to a message we already sent; it can neither create nor change
  // an order, so the worst a forged call can do is mislabel a delivery
  // receipt. The verify token keeps even that shut.

  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @Get('whatsapp/webhook')
  @ApiExcludeEndpoint()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response
  ) {
    const expected = this.configService.whatsappWebhookVerifyToken;

    // Without a configured token there is nothing to check against, so the
    // handshake is refused rather than accepting any caller's subscription.
    if (!expected || mode !== 'subscribe' || token !== expected) {
      this.logger.warn('Rejected a WhatsApp webhook verification attempt');
      res.status(403).send('Forbidden');
      return;
    }

    res.status(200).send(challenge);
  }

  @Public()
  @Throttle({ default: { limit: 300, ttl: 60000 } })
  @Post('whatsapp/webhook')
  @HttpCode(200)
  @ApiExcludeEndpoint()
  async receiveWebhook(@Body() body: MetaWebhookBody) {
    // Always answer 200. Meta retries anything else, and a retry storm over a
    // status update we could not parse helps nobody.
    try {
      const statuses =
        body?.entry?.flatMap(entry => entry.changes?.flatMap(c => c.value?.statuses ?? []) ?? []) ??
        [];

      for (const status of statuses) {
        if (!status?.id || !status.status) continue;
        if (!DELIVERY_STATUSES.includes(status.status as DeliveryStatus)) continue;
        await this.notificationsService.recordDeliveryStatus(
          status.id,
          status.status as DeliveryStatus
        );
      }
    } catch (err) {
      this.logger.error(`WhatsApp webhook could not be processed: ${(err as Error).message}`);
    }

    return { received: true };
  }
}
