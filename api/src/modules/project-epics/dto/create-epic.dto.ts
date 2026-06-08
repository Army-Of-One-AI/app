import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateEpicDto {
  @IsString()
  @MaxLength(120)
  title: string;

  @IsOptional()
  description?: {
    html: string;
    plainText: string;
  };

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
