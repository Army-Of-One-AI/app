import { ArrayMaxSize, ArrayMinSize, IsArray, IsEmail } from 'class-validator';

export default class InviteByEmailsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsEmail({}, { each: true })
  emails: string[];
}
