import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  MinLength,
  IsDateString,
} from 'class-validator';
import { Gender, TeacherPaymentType } from '@prisma/client';

export class CreateTeacherDto {
  @IsString()
  @MinLength(7)
  phone: string;

  @IsString()
  @MinLength(2)
  firstName: string;

  @IsString()
  @MinLength(2)
  lastName: string;
  @IsEnum(Gender)
  gender: Gender;
  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(TeacherPaymentType)
  paymentType: TeacherPaymentType;
  @IsDateString()
  birthDate: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  monthlySalary?: number | null;
  @IsOptional()
  @IsString()
  photoUrl?: string;
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  percent?: number;
}
