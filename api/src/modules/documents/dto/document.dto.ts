import { DocumentStatus } from '../../../../generated/prisma/client.cjs';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class ProjectDocumentParamDto {
  @ApiProperty({ example: '0f8fad5b-d9cb-469f-a165-70867728950e' })
  @IsUUID()
  projectId: string;
}

export class DocumentIdParamDto {
  @ApiProperty({ example: '0f8fad5b-d9cb-469f-a165-70867728950e' })
  @IsUUID()
  documentId: string;
}

export class CreateDocumentDto {
  @ApiProperty({ example: 'Project Brief' })
  @IsString()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'project-brief' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  slug?: string;

  @ApiPropertyOptional({ example: { markdown: '# Project Brief\nGoals and scope...' } })
  @IsOptional()
  @IsObject()
  content?: object;

  @ApiPropertyOptional({ enum: DocumentStatus, example: DocumentStatus.Draft })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;
}

export class UpdateDocumentDto {
  @ApiPropertyOptional({ example: 'Updated Project Brief' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: { markdown: '# Updated Brief\nNew details...' } })
  @IsOptional()
  @IsObject()
  content?: object;
}

export class UpdateDocumentStatusDto {
  @ApiProperty({ enum: DocumentStatus, example: DocumentStatus.Published })
  @IsEnum(DocumentStatus)
  status: DocumentStatus;
}

export class DocumentQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ enum: DocumentStatus, example: DocumentStatus.Published })
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;
}
