import { Module } from '@nestjs/common';
import { InboxItemsService } from './inbox-items.service';
import { InboxItemsController } from './inbox-items.controller';
import PrismaService from 'src/shared/services/prisma.service';

@Module({
  controllers: [InboxItemsController],
  providers: [InboxItemsService, PrismaService],
  exports: [InboxItemsService],
})
export class InboxItemsModule {}
