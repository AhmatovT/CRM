import { Body, Controller, ForbiddenException, Param, Patch, Post, Req } from '@nestjs/common';
// import { Roles } from '@/common/decorators/roles.decorator';
import { TeacherAcademicService } from '../services/teacher.academic.service';
import { CreateIshRejaDto } from '../dto/create-ishreja.dto';
import { CreateLessonDto } from '../dto/create-lesson.dto';

// @Roles('TEACHER')
@Controller('teachers')
export class TeacherCommandController {
  constructor(
    private readonly academicService: TeacherAcademicService,
  ) {}

  @Post(':id/ishreja')
  createIshReja(
    @Req() req,
    @Param('id') teacherId: string,
    @Body() dto: CreateIshRejaDto,
  ) {
    if (req.user.role === 'TEACHER' && req.user.id !== teacherId) {
      throw new ForbiddenException();
    }
    return this.academicService.createIshReja(teacherId, dto);
  }

  @Post(':id/lesson')
  createLesson(
    @Req() req,
    @Param('id') teacherId: string,
    @Body() dto: CreateLessonDto,
  ) {
    if (req.user.role === 'TEACHER' && req.user.id !== teacherId) {
      throw new ForbiddenException();
    }
    return this.academicService.createLesson(teacherId, dto);
  }

  @Patch('/lessons/:lessonId/activate')
markLessonActive(
  @Param('lessonId') lessonId: string,
) {
  return this.academicService.markLessonActive(lessonId);
}

}
