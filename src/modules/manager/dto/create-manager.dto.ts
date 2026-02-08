import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateManagerDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @MinLength(8)
  password: string;

  // ===== MANAGER PROFILE =====

  @IsString()
  @IsOptional()
  note?: string;
}
