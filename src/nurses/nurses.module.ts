// src/nurses/nurses.module.ts
import { Module } from '@nestjs/common';
import { NursesService } from './nurses.service';
import { NursesController } from './nurses.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [NursesService],
  controllers: [NursesController],
})
export class NursesModule {}