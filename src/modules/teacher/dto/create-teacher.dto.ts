import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { TeacherPaymentType } from '@prisma/client';

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

  @IsString()
  @MinLength(6)
  password: string;

  @IsEnum(TeacherPaymentType)
  paymentType: TeacherPaymentType;

  @IsOptional()
  @IsNumber()
  @Min(1)
  monthlySalary?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  percent?: number;
}
