import { IsArray, IsUUID, ArrayMinSize } from 'class-validator';

export class ReorderBoardColumnsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  columnIds: string[];
}
