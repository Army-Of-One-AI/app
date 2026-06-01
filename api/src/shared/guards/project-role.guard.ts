import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  mixin,
  Type,
} from '@nestjs/common';
import { ProjectRole } from 'generated/prisma/enums';
import PrismaService from '../services/prisma.service';
import { Request } from 'express';
import { AuthUser } from '../types/types';

export function ProjectRoleGuard(roles: ProjectRole[]): Type<CanActivate> {
  @Injectable()
  class ProjectRoleGuardMixin implements CanActivate {
    constructor(private readonly prisma: PrismaService) {}

    async canActivate(ctx: ExecutionContext) {
      const req: Request = ctx.switchToHttp().getRequest();
      const user = req.user as AuthUser | undefined;
      const workspaceSlug = req.params.workspaceSlug as string;
      const projectSlug = (req.params.projectSlug || req.params.slug) as string;

      if (!user || !user.id) {
        throw new ForbiddenException('User is not authenticated');
      }

      if (!workspaceSlug) {
        throw new BadRequestException('Workspace slug is required in params');
      }

      if (!projectSlug) {
        throw new BadRequestException('Project slug is required in params');
      }

      const member = await this.prisma.projectMember.findFirst({
        where: {
          member_id: user.id,
          role: {
            in: roles,
          },
          project: {
            slug: projectSlug,
            workspace: {
              slug: workspaceSlug,
            },
          },
        },
      });

      if (!member) {
        throw new ForbiddenException('Insufficient project permission');
      }

      return true;
    }
  }

  return mixin(ProjectRoleGuardMixin);
}
