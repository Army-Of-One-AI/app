import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { mergeMap } from 'rxjs';
import { PermissionsService } from 'src/modules/permissions/permissions.service';
import { AuthUser } from '../types/types';

@Injectable()
export class CurrentUserProjectPermissionsInterceptor implements NestInterceptor {
  constructor(private readonly permissionsService: PermissionsService) {}

  intercept(context: ExecutionContext, next: CallHandler) {
    const req: Request = context.switchToHttp().getRequest();
    const user = req.user as AuthUser | undefined;
    const projectSlug = req.params.projectSlug as string;
    const workspaceSlug = req.params.workspaceSlug as string;

    return next.handle().pipe(
      mergeMap(async (data) => {
        if (!user || !projectSlug || !workspaceSlug) {
          return data as unknown;
        }

        const currentUser =
          await this.permissionsService.getCurrentUserProjectPermissions({
            userId: user.id,
            projectSlug,
            workspaceSlug,
          });

        return {
          ...data,
          currentUser,
        } as unknown;
      }),
    );
  }
}
