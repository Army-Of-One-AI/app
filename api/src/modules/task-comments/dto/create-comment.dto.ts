import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

class CommentContentDto {
  @IsString()
  @MaxLength(10000)
  html: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  plainText: string;
}

export class CreateCommentDto {
  @ValidateNested()
  @Type(() => CommentContentDto)
  content: CommentContentDto;

  @IsOptional()
  @IsUUID()
  replyToCommentId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID('4', { each: true })
  mentionedUserIds?: string[];
}
