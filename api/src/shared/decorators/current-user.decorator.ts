import { createParamDecorator } from '@nestjs/common';
import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const CurrentUser = createParamDecorator((_, ctx: ExecutionContext) => {
  const req: Request = ctx.switchToHttp().getRequest();
  return req.user;
});
