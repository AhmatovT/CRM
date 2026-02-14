import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { Prisma, Role, TeacherPaymentType, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class TeacherService {
  constructor(private readonly prisma: PrismaService) {}

  // ===============================
  // SALARY VALIDATION
  // ===============================
  private validateSalary(dto: CreateTeacherDto | UpdateTeacherDto) {
    if (!dto.paymentType) return;

    if (dto.paymentType === TeacherPaymentType.SALARY) {
      if (dto.monthlySalary == null) {
        throw new BadRequestException(
          'monthlySalary is required when paymentType is SALARY',
        );
      }
      if (dto.percent != null) {
        throw new BadRequestException(
          'SALARY type teacher cannot have percent',
        );
      }
    }

    if (dto.paymentType === TeacherPaymentType.PERCENT) {
      if (dto.percent == null) {
        throw new BadRequestException(
          'percent is required when paymentType is PERCENT',
        );
      }
      if (dto.monthlySalary != null) {
        throw new BadRequestException(
          'PERCENT type teacher cannot have monthlySalary',
        );
      }
    }
  }

  // ===============================
  // CREATE
  // ===============================
  async create(dto: CreateTeacherDto) {
    this.validateSalary(dto);

    const existingUser = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (existingUser) {
      throw new ConflictException('Phone already exists');
    }

    const passwordHash = dto.password ? await argon2.hash(dto.password) : null;

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          phone: dto.phone,
          passwordHash,
          role: Role.TEACHER,
          status: UserStatus.ACTIVE,
        },
      });

      return tx.teacherProfile.create({
        data: {
          userId: user.id,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          gender: dto.gender ?? null,
          paymentType: dto.paymentType,
          monthlySalary:
            dto.paymentType === TeacherPaymentType.SALARY
              ? dto.monthlySalary
              : null,
          percent:
            dto.paymentType === TeacherPaymentType.PERCENT ? dto.percent : null,
        },
        include: { user: true },
      });
    });
  }

  // ===============================
  // UPDATE
  // ===============================
  async update(id: string, dto: UpdateTeacherDto) {
    const teacher = await this.findById(id);

    this.validateSalary(dto);

    return this.prisma.$transaction(async (tx) => {
      // USER UPDATE
      const userData: Prisma.UserUpdateInput = {};

      if (dto.phone) {
        const existing = await tx.user.findUnique({
          where: { phone: dto.phone },
        });

        if (existing && existing.id !== teacher.userId) {
          throw new ConflictException('Phone already exists');
        }

        userData.phone = dto.phone;
      }

      if (dto.password) {
        userData.passwordHash = await argon2.hash(dto.password);
      }

      if (Object.keys(userData).length) {
        await tx.user.update({
          where: { id: teacher.userId },
          data: userData,
        });
      }

      // PROFILE UPDATE
      const profileData: Prisma.TeacherProfileUpdateInput = {};

      if (dto.firstName !== undefined) {
        profileData.firstName = dto.firstName.trim();
      }

      if (dto.lastName !== undefined) {
        profileData.lastName = dto.lastName.trim();
      }

      if (dto.gender !== undefined) {
        profileData.gender = dto.gender;
      }

      if (dto.paymentType !== undefined) {
        profileData.paymentType = dto.paymentType;

        if (dto.paymentType === TeacherPaymentType.SALARY) {
          profileData.monthlySalary = dto.monthlySalary ?? null;
          profileData.percent = null;
        }

        if (dto.paymentType === TeacherPaymentType.PERCENT) {
          profileData.percent = dto.percent ?? null;
          profileData.monthlySalary = null;
        }
      }

      return tx.teacherProfile.update({
        where: { id },
        data: profileData,
        include: { user: true },
      });
    });
  }

  // ===============================
  // GET ONE
  // ===============================
  async findById(id: string) {
    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!teacher || teacher.deletedAt) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }

  // ===============================
  // GET ALL
  // ===============================
  async findAll() {
    return this.prisma.teacherProfile.findMany({
      where: { deletedAt: null },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ===============================
  // SOFT DELETE
  // ===============================
  async softDelete(id: string, adminId: string) {
    const teacher = await this.findById(id);

    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: teacher.userId },
        data: { status: UserStatus.BLOCKED },
      });

      return tx.teacherProfile.update({
        where: { id },
        data: {
          isActive: false,
          deletedAt: new Date(),
          deletedById: adminId,
        },
      });
    });
  }

  // ===============================
  // RESTORE
  // ===============================
  async restore(id: string) {
    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!teacher || !teacher.deletedAt) {
      throw new NotFoundException('Deleted teacher not found');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: teacher.userId },
        data: { status: UserStatus.ACTIVE },
      });

      return tx.teacherProfile.update({
        where: { id },
        data: {
          isActive: true,
          deletedAt: null,
          deletedById: null,
          deleteReason: null,
        },
      });
    });
  }

  // ===============================
  // DELETE HISTORY
  // ===============================
  async getDeleteHistory() {
    const deletedTeachers = await this.prisma.teacherProfile.findMany({
      where: {
        deletedAt: { not: null },
      },
      include: {
        deletedBy: {
          select: {
            id: true,
            role: true,
            phone: true,
          },
        },
      },
      orderBy: {
        deletedAt: 'desc',
      },
    });

    return deletedTeachers.map((t) => ({
      teacherId: t.id,
      firstName: t.firstName,
      lastName: t.lastName,
      deletedAt: t.deletedAt,
      deletedById: t.deletedById,
      deletedByRole: t.deletedBy?.role,
      deletedByPhone: t.deletedBy?.phone,
    }));
  }
}
