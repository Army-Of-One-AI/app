import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ModelProviderType } from '../../generated/prisma/client';

export class UpdateModelProviderDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  name?: string;

  @IsEnum(ModelProviderType)
  @IsOptional()
  type?: ModelProviderType;

  @IsString()
  @IsOptional()
  baseUrl?: string;

  @IsString()
  @IsOptional()
  modelName?: string;

  @IsString()
  @IsOptional()
  apiKey?: string;
}
