import { IsInt, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateTeacherDto {
  // USER
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(8)
  password: string;

  // SALARY (BITTASI MAJBURIY)
  @IsOptional()
  @IsInt()
monthlySalary: number ;

  @IsOptional()
  @IsInt()
  percent?: number;
}
