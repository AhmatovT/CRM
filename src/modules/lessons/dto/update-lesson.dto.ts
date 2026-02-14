import { IsString, IsDateString, IsInt, Min, IsOptional } from 'class-validator';

export class UpdateLessonDto {
  @IsOptional()
  @IsString()
  section?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsDateString()
  lessonDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  startMin?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  endMin?: number;
}
