import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateBoardDto {
  @IsUUID()
  projectId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;
}
