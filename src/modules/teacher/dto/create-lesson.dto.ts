import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateLessonDto {
  @IsUUID()
  @IsNotEmpty()
  ishRejaId: string;

  @IsString()
  @IsNotEmpty()
  title: string;
}
