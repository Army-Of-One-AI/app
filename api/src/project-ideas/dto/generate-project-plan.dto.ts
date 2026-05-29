import {
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const productPriorities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
const productStages = ['MVP', 'V2', 'Future'] as const;
const generationModes = ['FAST', 'DEEP'] as const;

export class ProjectIdeaFeatureDto {
  @IsString()
  id: string;

  @IsString()
  title: string;

  @IsString()
  summary: string;

  @IsString()
  domain: string;

  @IsIn(productPriorities)
  priority: (typeof productPriorities)[number];

  @IsIn(productStages)
  stage: (typeof productStages)[number];
}

export class GenerateProjectPlanDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProjectIdeaFeatureDto)
  features: ProjectIdeaFeatureDto[];

  @IsIn(generationModes)
  @IsOptional()
  generationMode?: (typeof generationModes)[number];
}
