import { IsOptional, IsString } from 'class-validator';

export default class CreateTaskLabelDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  color?: string;
}
