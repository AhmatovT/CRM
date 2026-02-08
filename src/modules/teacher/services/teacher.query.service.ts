import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TeacherResponseDto } from '../dto/teacher-response.dto';
import { CreateTeacherDto } from '../dto/create-teacher.dto';
import { hashPassword } from 'src/common/utils/password.util';

@Injectable()
export class TeacherQueryService {
  constructor(private readonly prisma: PrismaService) {}

  // ===============================
  // CREATE TEACHER
  // ===============================
  async createTeacher(dto: CreateTeacherDto) {
    // ❌ ikkalasi ham yo‘q
    if (dto.monthlySalary == null && dto.percent == null) {
      throw new BadRequestException(
        'Either monthlySalary or percent must be provided',
      );
    }

    // ❌ ikkalasi birga
    if (dto.monthlySalary != null && dto.percent != null) {
      throw new BadRequestException(
        'monthlySalary and percent cannot be used together',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          password: await hashPassword(dto.password),
          role: 'TEACHER',
        },
      });

      return tx.teacherProfile.create({
        data: {
          userId: createdUser.id,
          monthlySalary: dto.monthlySalary ?? null,
          percent: dto.percent ?? null,
        },
      });
    });
  }

  // ===============================
  // SOFT DELETE TEACHER
  // ===============================
async softDeleteTeacherByUserId(userId: string) {
  const teacher = await this.prisma.teacherProfile.findUnique({
    where: { userId },
  });

  if (!teacher || teacher.deletedAt) {
    throw new NotFoundException('Teacher not found');
  }

  return this.prisma.teacherProfile.update({
    where: { userId },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  });
}

  // ===============================
  // GET ALL TEACHERS
  // ===============================
  async getAll(): Promise<TeacherResponseDto[]> {
    const teachers = await this.prisma.teacherProfile.findMany({
      where: { deletedAt: null },
      include: { user: true },
    });

    return teachers.map((t) => this.toDto(t));
  }

  // ===============================
  // GET TEACHER BY ID
  // ===============================
  async getById(teacherId: string): Promise<TeacherResponseDto> {
    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { id: teacherId },
      include: { user: true },
    });

    if (!teacher || teacher.deletedAt) {
      throw new NotFoundException('Teacher not found');
    }

    return this.toDto(teacher);
  }

  // ===============================
  // MAPPER
  // ===============================
  private toDto(t: any): TeacherResponseDto {
    return {
      id: t.id,
      firstName: t.user.firstName,
      lastName: t.user.lastName,
      phone: t.user.phone,
      monthlySalary: t.monthlySalary,
      percent: t.percent,
      createdAt: t.createdAt,
    };
  }
}
