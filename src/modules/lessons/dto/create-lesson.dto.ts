import { IsString, IsDateString, IsInt, Min } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  groupId: string;

  @IsString()
  teacherId: string;

  @IsString()
  section: string;

  @IsString()
  title: string;

  @IsString()
  content?: string;

  @IsDateString()
  lessonDate: string;

  @IsInt()
  @Min(0)
  startMin: number;

  @IsInt()
  @Min(1)
  endMin: number;
}
