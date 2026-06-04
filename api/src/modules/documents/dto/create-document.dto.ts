import { Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';

class DocumentContentDto {
  @IsString()
  html: string;

  @IsString()
  plainText: string;
}

export default class CreateDocumentDto {
  @IsString()
  title: string;

  @ValidateNested()
  @Type(() => DocumentContentDto)
  content: DocumentContentDto;
}
