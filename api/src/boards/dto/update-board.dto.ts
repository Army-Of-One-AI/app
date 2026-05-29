import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateBoardDto {
  @IsString()
  @IsOptional()
  @MaxLength(120)
  name?: string;
}
