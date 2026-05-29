import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { DocumentSourceType } from '../../generated/prisma/client';

export class UpdateDocumentDto {
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(DocumentSourceType)
  @IsOptional()
  sourceType?: DocumentSourceType;
}
