import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

export class OpenAttendanceSessionDto {
  @IsString()
  groupId!: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @MaxLength(200)
  note?: string;
}

export class FinalizeAttendanceDto {
  @IsString()
  sessionId!: string;

  @IsOptional()
  @MaxLength(200)
  note?: string;
}
