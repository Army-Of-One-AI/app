import { Controller } from '@nestjs/common';
import { ClickHouseService } from './click-house.service';

@Controller('click-house')
export class ClickHouseController {
  constructor(private readonly clickHouseService: ClickHouseService) {}
}
