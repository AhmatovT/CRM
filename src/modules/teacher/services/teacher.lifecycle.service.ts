import { Injectable } from '@nestjs/common';
import { CreateTeacherDto } from '../dto/create-teacher.dto';
import { PrismaService } from 'prisma/prisma.service';
import { hashPassword } from 'src/common/utils/password.util';

@Injectable()
export class TeacherLifecycleService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTeacherDto) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
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
          userId: user.id,
        },
      });
    });
  }

  async deactivate(teacherId: string, adminId: string) {
    return this.prisma.teacherProfile.update({
      where: { id: teacherId },
      data: {
        isActive: false,
        deletedAt: new Date(),
        deletedById: adminId,
      },
    });
  }
}
