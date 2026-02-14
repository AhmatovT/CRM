import { IsString, Matches } from 'class-validator';

export class AttendanceMonthlyDto {
  @IsString()
  groupId!: string;

  // "YYYY-MM"
  @Matches(/^\d{4}-\d{2}$/)
  month!: string;
}
