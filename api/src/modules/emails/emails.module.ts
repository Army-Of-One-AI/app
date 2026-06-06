import { Module } from '@nestjs/common';
import { EMAILS_QUEUE, EmailsService } from './emails.service';
import { EmailsController } from './emails.controller';
import { BullModule } from '@nestjs/bullmq';
import { EmailsProcessor } from './queues/emails.processor';
import PrismaService from 'src/shared/services/prisma.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: EMAILS_QUEUE,
    }),
  ],
  controllers: [EmailsController],
  providers: [EmailsService, PrismaService, EmailsProcessor],
  exports: [EmailsService],
})
export class EmailsModule {}
