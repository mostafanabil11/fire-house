import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsScheduler } from './notifications.scheduler';
import { WhatsAppProvider } from './whatsapp.provider';
import {
  NotificationOutbox,
  NotificationOutboxSchema,
} from './schemas/notification-outbox.schema';
import { ConfigModule } from '@/config/config.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationOutbox.name, schema: NotificationOutboxSchema },
    ]),
    ConfigModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsScheduler, WhatsAppProvider],
  exports: [NotificationsService],
})
export class NotificationsModule {}

