import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ProjectRole } from 'generated/prisma/enums';

export default class AddMemberToProject {
  @IsUUID()
  targetUserId: string;

  @IsOptional()
  @IsEnum(ProjectRole)
  role?: ProjectRole;
}
