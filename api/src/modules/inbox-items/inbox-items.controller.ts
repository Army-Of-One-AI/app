import { Controller, Get, UseGuards } from '@nestjs/common';
import { InboxItemsService } from './inbox-items.service';
import JWTAuthGuard from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';

@Controller('inbox')
export class InboxItemsController {
  constructor(private readonly inboxItemsService: InboxItemsService) {}

  @UseGuards(JWTAuthGuard)
  @Get('')
  async getCurrentUserInbox(@CurrentUser() user: { id: string }) {
    return await this.inboxItemsService.getUserInboxItems(user.id);
  }
}
