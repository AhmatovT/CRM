import { Gender } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsDateString()
  birthDate: string;

  @IsEnum(Gender)
  gender: Gender;

  @IsString()
  @IsNotEmpty()
  address: string;

  // 🔥 optional qilindi
  @IsOptional()
  @IsString()
  idCard?: string;

  // 🔥 optional qilindi
  @IsOptional()
  @IsString()
  photoUrl?: string;

  // 🔥 note qo‘shildi
  @IsOptional()
  @IsString()
  note?: string;
}
