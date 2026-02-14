import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { LessonStatus } from '@prisma/client';

@Injectable()
export class LessonsService {
  constructor(private readonly prisma: PrismaService) {}

  // ✅ CREATE LESSON
  // Teacher lesson yaratadi
  async create(dto: CreateLessonDto, userId: string) {
    // 🔥 Vaqt validatsiya
    if (dto.startMin >= dto.endMin) {
      throw new BadRequestException('startMin endMin dan kichik bo‘lishi kerak');
    }

    if (dto.startMin < 0 || dto.endMin > 1440) {
      throw new BadRequestException('Vaqt noto‘g‘ri');
    }

    // 🔥 Sana validatsiya
    const lessonDate = new Date(dto.lessonDate);

    if (isNaN(lessonDate.getTime())) {
      throw new BadRequestException('Sana noto‘g‘ri');
    }

    // 🔥 Overlap check (faqat bitta guruh ichida)
    const overlap = await this.prisma.lesson.findFirst({
      where: {
        groupId: dto.groupId,
        lessonDate,
        startMin: { lt: dto.endMin },
        endMin: { gt: dto.startMin },
      },
    });

    if (overlap) {
      throw new BadRequestException('Bu vaqtda boshqa lesson mavjud');
    }

    // ✅ Lesson yaratish
    return this.prisma.lesson.create({
      data: {
        groupId: dto.groupId,
        teacherId: userId, // 🔥 Teacher login orqali olinadi

        section: dto.section,
        title: dto.title,
        content: dto.content,

        lessonDate,
        startMin: dto.startMin,
        endMin: dto.endMin,

        status: LessonStatus.PLANNED,
      },
    });
  }

  // ✅ UPDATE LESSON
  // Teacher lessonni edit qiladi
  async update(id: string, dto: UpdateLessonDto, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson topilmadi');
    }

    // 🔥 OWNERSHIP CHECK
    if (lesson.teacherId !== userId) {
      throw new BadRequestException('Bu lesson sizga tegishli emas');
    }

    // 🔥 HELD LOCK
    if (lesson.status === LessonStatus.HELD) {
      throw new BadRequestException('O‘tilgan darsni o‘zgartirib bo‘lmaydi');
    }

    // 🔥 Safe vaqt validatsiya
    const startMin = dto.startMin ?? lesson.startMin;
    const endMin = dto.endMin ?? lesson.endMin;

    if (startMin >= endMin) {
      throw new BadRequestException('Vaqt noto‘g‘ri');
    }

    if (startMin < 0 || endMin > 1440) {
      throw new BadRequestException('Vaqt noto‘g‘ri');
    }

    // 🔥 Safe sana validatsiya
    const lessonDate = dto.lessonDate
      ? new Date(dto.lessonDate)
      : lesson.lessonDate;

    if (dto.lessonDate && isNaN(lessonDate.getTime())) {
      throw new BadRequestException('Sana noto‘g‘ri');
    }

    // 🔥 Overlap check (self skip bilan)
    const overlap = await this.prisma.lesson.findFirst({
      where: {
        id: { not: id },
        groupId: lesson.groupId,
        lessonDate,
        startMin: { lt: endMin },
        endMin: { gt: startMin },
      },
    });

    if (overlap) {
      throw new BadRequestException('Bu vaqtda boshqa lesson mavjud');
    }

    // ✅ Update
    return this.prisma.lesson.update({
      where: { id },
      data: {
        section: dto.section,
        title: dto.title,
        content: dto.content,
        lessonDate: dto.lessonDate ? lessonDate : undefined,
        startMin: dto.startMin,
        endMin: dto.endMin,
      },
    });
  }

  // ✅ MARK AS HELD
  // Teacher lessonni o‘tilgan qiladi
  async markAsHeld(id: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson topilmadi');
    }

    // 🔥 OWNERSHIP CHECK
    if (lesson.teacherId !== userId) {
      throw new BadRequestException('Bu lesson sizga tegishli emas');
    }

    if (lesson.status === LessonStatus.HELD) {
      throw new BadRequestException('Allaqachon o‘tilgan');
    }

    return this.prisma.lesson.update({
      where: { id },
      data: {
        status: LessonStatus.HELD,
        heldAt: new Date(),
      },
    });
  }

  // ✅ FIND ALL (Teacher lessons)
  async findAll(userId: string) {
    return this.prisma.lesson.findMany({
      where: { teacherId: userId }, // 🔥 Faqat teacher lessonlari
      orderBy: [
        { lessonDate: 'asc' },
        { startMin: 'asc' },
      ],
    });
  }

  // ✅ FIND ONE
  async findOne(id: string, userId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson topilmadi');
    }

    // 🔥 OWNERSHIP CHECK
    if (lesson.teacherId !== userId) {
      throw new BadRequestException('Bu lesson sizga tegishli emas');
    }

    return lesson;
  }
}