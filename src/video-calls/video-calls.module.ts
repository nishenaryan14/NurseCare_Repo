import { Module } from '@nestjs/common';
import { VideoCallsService } from './video-calls.service';
import { VideoCallsController } from './video-calls.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [VideoCallsService],
  controllers: [VideoCallsController],
  exports: [VideoCallsService],
})
export class VideoCallsModule {}
