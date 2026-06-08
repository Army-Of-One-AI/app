import { Module } from '@nestjs/common';
import { ClickHouseService } from './click-house.service';
import { ClickHouseController } from './click-house.controller';
import PrismaService from 'src/shared/services/prisma.service';

@Module({
  controllers: [ClickHouseController],
  providers: [ClickHouseService, PrismaService],
  exports: [ClickHouseService],
})
export class ClickHouseModule {}
