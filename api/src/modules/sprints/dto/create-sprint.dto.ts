import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSprintDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  goal?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
