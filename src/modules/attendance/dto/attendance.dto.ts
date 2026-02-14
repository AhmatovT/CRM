import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

// ✅ DTO uchun local enum (validator uchun 100% ishlaydi)
export enum AttendanceStatusDto {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  EXCUSED = 'EXCUSED',
}

export class MarkAttendanceDto {
  @IsString()
  sessionId!: string;

  @IsString()
  studentId!: string;

  @IsEnum(AttendanceStatusDto)
  status!: AttendanceStatusDto;

  @IsOptional()
  @MaxLength(200)
  comment?: string;
}

export class BulkAttendanceItemDto {
  @IsString()
  studentId!: string;

  @IsEnum(AttendanceStatusDto)
  status!: AttendanceStatusDto;

  @IsOptional()
  @MaxLength(200)
  comment?: string;
}

export class BulkAttendanceDto {
  @IsString()
  sessionId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkAttendanceItemDto)
  items!: BulkAttendanceItemDto[];
}
