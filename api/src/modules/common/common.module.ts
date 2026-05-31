import { Module } from '@nestjs/common';
import { AccessService } from './services/access.service';

@Module({
  providers: [AccessService],
  exports: [AccessService],
})
export class CommonModule {}
