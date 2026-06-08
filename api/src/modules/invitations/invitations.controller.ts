import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { InvitationsService } from './invitations.service';
import JWTAuthGuard from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';

@Controller('invitations')
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  @UseGuards(JWTAuthGuard)
  @Get()
  async getCurrentUserInvitations(@CurrentUser() user: { id: string }) {
    return await this.invitationsService.getCurrentUserInvitations(user.id);
  }

  @UseGuards(JWTAuthGuard)
  @Get(':invitationId')
  async getInvitationDetails(
    @CurrentUser() user: { id: string },
    @Param('invitationId') invitationId: string,
  ) {
    return await this.invitationsService.getInvitationDetails(
      user.id,
      invitationId,
    );
  }

  @UseGuards(JWTAuthGuard)
  @Post(':invitationId/accept')
  async acceptInvitation(
    @CurrentUser() user: { id: string },
    @Param('invitationId') invitationId: string,
  ) {
    return await this.invitationsService.acceptInvite(user.id, invitationId);
  }
}
