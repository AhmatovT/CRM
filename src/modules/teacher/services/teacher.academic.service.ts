import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateIshRejaDto } from '../dto/create-ishreja.dto';
import { CreateLessonDto } from '../dto/create-lesson.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class TeacherAcademicService {
  constructor(private readonly prisma: PrismaService) {}

  async createIshReja(teacherId: string, dto: CreateIshRejaDto) {
    return this.prisma.ishReja.create({
      data: {
        teacherId,
        groupId: dto.groupId,
        category: dto.category,
      },
    });
  }

  async createLesson(teacherId: string, dto: CreateLessonDto) {
    const ishReja = await this.prisma.ishReja.findUnique({
      where: { id: dto.ishRejaId },
    });

    if (!ishReja || ishReja.teacherId !== teacherId) {
      throw new ForbiddenException('Not your ish reja');
    }

    return this.prisma.lesson.create({
      data: {
        ishRejaId: dto.ishRejaId,
        title: dto.title,
      },
    });
  }

  async markLessonActive(lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
    });

    if (!lesson || lesson.deletedAt) {
      throw new NotFoundException('Lesson not found');
    }

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        isActive: true,
      },
    });
  }
}
