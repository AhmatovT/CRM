import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DeactivateManagerDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  reason?: string;
}
