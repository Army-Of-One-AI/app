import { Type } from 'class-transformer';
import { IsEnum } from 'class-validator';
import { WorkspaceRole } from 'generated/prisma/enums';

export default class updateMemberRoleDto {
  @IsEnum(WorkspaceRole)
  @Type()
  role: WorkspaceRole;
}
