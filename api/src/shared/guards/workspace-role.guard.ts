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
import { WorkspaceRole } from 'generated/prisma/enums';
import { AuthUser } from '../types/types';
import PrismaService from '../services/prisma.service';

export default function WorkspaceRoleGuard(
  roles: WorkspaceRole[],
): Type<CanActivate> {
  @Injectable()
  class WorkspaceRoleGuardMixin implements CanActivate {
    constructor(private readonly prisma: PrismaService) {}

    async canActivate(ctx: ExecutionContext) {
      const req: Request = ctx.switchToHttp().getRequest();
      const workspaceSlug = (req.params.workspaceSlug ||
        req.params.slug) as string;
      const user = req.user as AuthUser | undefined;

      if (!workspaceSlug) {
        throw new BadRequestException('Worksace is required in params');
      }

      if (!user || !user.id) {
        throw new ForbiddenException('User is not authenticated');
      }

      const workspaceMember = await this.prisma.workspaceMember.findFirst({
        where: {
          member_id: user.id,
          workspace: {
            slug: workspaceSlug,
          },
        },
      });

      if (!workspaceMember || !roles.includes(workspaceMember.role)) {
        throw new ForbiddenException('Insufficient workspace permission');
      }

      return true;
    }
  }

  return mixin(WorkspaceRoleGuardMixin);
}
