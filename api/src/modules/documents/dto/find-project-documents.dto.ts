import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export enum FindProjectsOrderBy {
  'Latest' = 'latest',
  'Oldest' = 'oldest',
}

export default class findProjectDocumentsDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(FindProjectsOrderBy)
  @Type()
  orderBy?: FindProjectsOrderBy = FindProjectsOrderBy.Latest;

  @IsOptional()
  @IsString()
  creatorId?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;
}
