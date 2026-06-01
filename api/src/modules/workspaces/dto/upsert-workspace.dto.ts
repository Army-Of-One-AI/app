import { IsOptional, IsString } from 'class-validator';

export default class UpsertWorkspaceDto {
  @IsString()
  name: string = '';

  @IsString()
  slug: string = '';

  @IsOptional()
  @IsString()
  logoURL?: string;
}
