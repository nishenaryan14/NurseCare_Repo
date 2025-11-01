import { Module } from '@nestjs/common';
import { MessagingService } from './messaging.service';
import { MessagingGateway } from './messaging/messaging.gateway';
import { MessagingController } from './messaging.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [MessagingService, MessagingGateway],
  controllers: [MessagingController],
  exports: [MessagingService],
})
export class MessagingModule {}
