import { Controller } from '@nestjs/common';
import { TaskLabelsService } from './task-labels.service';

@Controller('task-labels')
export class TaskLabelsController {
  constructor(private readonly taskLabelsService: TaskLabelsService) {}
}
