import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ModelProviderType } from '../../generated/prisma/client';

export class CreateModelProviderDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsEnum(ModelProviderType)
  type: ModelProviderType;

  @IsString()
  @IsOptional()
  baseUrl?: string;

  @IsString()
  @IsNotEmpty()
  modelName: string;

  @IsString()
  @IsOptional()
  apiKey?: string;
}
