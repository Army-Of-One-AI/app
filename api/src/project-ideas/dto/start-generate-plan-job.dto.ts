import {
  IsArray,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ProjectIdeaFeatureDto } from './generate-project-plan.dto';

const generationModes = ['FAST', 'DEEP'] as const;

export class StartGeneratePlanJobDto {
  @IsUUID()
  workspaceId: string;

  @IsString()
  projectName: string;

  @IsString()
  idea: string;

  @IsIn(generationModes)
  @IsOptional()
  generationMode?: (typeof generationModes)[number];

  @IsObject()
  productVision: Record<string, unknown>;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectIdeaFeatureDto)
  selectedFeatures: ProjectIdeaFeatureDto[];
}
