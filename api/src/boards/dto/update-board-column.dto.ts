import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class UpdateBoardColumnDto {
  @IsString()
  @IsOptional()
  @MaxLength(80)
  name?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}
