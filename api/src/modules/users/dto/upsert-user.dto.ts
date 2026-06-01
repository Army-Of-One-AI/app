import { IsEmail, IsOptional, IsString } from 'class-validator';

export default class UpsertUserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  avatarImageURL?: string;

  @IsOptional()
  @IsString()
  phoneNo?: string;
}
