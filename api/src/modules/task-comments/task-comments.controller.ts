import { Controller } from '@nestjs/common';
import { TaskCommentsService } from './task-comments.service';

@Controller('task-comments')
export class TaskCommentsController {
  constructor(private readonly taskCommentsService: TaskCommentsService) {}
}
