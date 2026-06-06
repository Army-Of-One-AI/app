import { IsOptional, IsString, Length, Matches } from 'class-validator';

export default class UpsertWorkspaceDto {
  @IsString()
  name: string = '';

  @IsString()
  @Length(3, 50)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens',
  })
  slug: string;

  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9]+$/)
  logoURL?: string;
}
