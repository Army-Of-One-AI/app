import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

const generationModes = ['FAST', 'DEEP'] as const;

export class ExpandProjectIdeaDto {
  @IsUUID()
  workspaceId: string;

  @IsString()
  @MaxLength(160)
  projectName: string;

  @IsString()
  idea: string;

  @IsString()
  @IsOptional()
  targetAudience?: string;

  @IsString()
  @IsOptional()
  goals?: string;

  @IsIn(generationModes)
  @IsOptional()
  generationMode?: (typeof generationModes)[number];
}
