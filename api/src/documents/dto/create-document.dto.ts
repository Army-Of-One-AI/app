import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { DocumentSourceType } from '../../generated/prisma/client';

export class CreateDocumentDto {
  @IsUUID()
  @IsOptional()
  projectId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsEnum(DocumentSourceType)
  @IsOptional()
  sourceType?: DocumentSourceType;
}
