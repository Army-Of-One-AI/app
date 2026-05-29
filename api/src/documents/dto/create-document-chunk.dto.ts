import {
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Prisma } from '../../generated/prisma/client';

export class CreateDocumentChunkDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsInt()
  @Min(0)
  index: number;

  @IsObject()
  @IsOptional()
  embedding?: Prisma.InputJsonObject;
}
