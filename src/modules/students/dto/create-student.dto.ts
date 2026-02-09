import { IsOptional, IsString, MinLength, IsUrl } from 'class-validator';

export class CreateStudentDto {
  // auth
  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  // profile
  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;

  @IsString()
  address: string;

  @IsString()
  idCard: string;

  @IsUrl()
  photoUrl: string;
}
