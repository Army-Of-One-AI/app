import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  mixin,
  Type,
} from '@nestjs/common';
import { Request } from 'express';
import { TeamRole } from 'generated/prisma/enums';
import { AuthUser } from '../types/types';
import PrismaService from '../services/prisma.service';

export default function TeamRoleGuard(roles: TeamRole[]): Type<CanActivate> {
  @Injectable()
  class TeamRoleGuardMixin implements CanActivate {
    constructor(private readonly prisma: PrismaService) {}

    async canActivate(ctx: ExecutionContext) {
      const req: Request = ctx.switchToHttp().getRequest();
      const user = req.user as AuthUser | undefined;
      const workspaceSlug = req.params.workspaceSlug as string;
      const teamSlug = (req.params.teamSlug || req.params.slug) as string;

      if (!workspaceSlug) {
        throw new BadRequestException('Workspace slug is required in params');
      }

      if (!teamSlug) {
        throw new BadRequestException('Team slug is required in params');
      }

      if (!user || !user.id) {
        throw new ForbiddenException('User is not authenticated');
      }

      const teamMember = await this.prisma.teamMember.findFirst({
        where: {
          role: {
            in: roles,
          },
          team: {
            slug: teamSlug,
            workspace: {
              slug: workspaceSlug,
              members: {
                some: {
                  member_id: user.id,
                },
              },
            },
          },
        },
      });

      if (!teamMember) {
        throw new ForbiddenException('Insufficient team permission');
      }

      return true;
    }
  }

  return mixin(TeamRoleGuardMixin);
}
