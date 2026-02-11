import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { Prisma, Role, UserStatus } from '@prisma/client';
import * as argon2 from 'argon2';

@Injectable()
export class TeacherService {
  constructor(private readonly prisma: PrismaService) {}

  // ===============================
  // SALARY VALIDATION
  // ===============================
  private validateSalary(dto: CreateTeacherDto | UpdateTeacherDto) {
    if (!dto.paymentType) return;

    if (dto.paymentType === 'FIXED') {
      if (dto.monthlySalary === undefined) {
        throw new BadRequestException(
          'monthlySalary is required for FIXED teachers',
        );
      }
      if (dto.percent !== undefined) {
        throw new BadRequestException('FIXED teacher cannot have percent');
      }
    }

    if (dto.paymentType === 'PERCENT') {
      if (dto.percent === undefined) {
        throw new BadRequestException(
          'percent is required for PERCENT teachers',
        );
      }
      if (dto.monthlySalary !== undefined) {
        throw new BadRequestException(
          'PERCENT teacher cannot have monthlySalary',
        );
      }
    }
  }

  // ===============================
  // CREATE
  // ===============================
  async create(dto: CreateTeacherDto) {
    this.validateSalary(dto);

    try {
      const passwordHash = dto.password
        ? await argon2.hash(dto.password)
        : null;

      return await this.prisma.$transaction(async (tx) => {
        // 1️⃣ USER (AUTH)
        const user = await tx.user.create({
          data: {
            phone: dto.phone,
            passwordHash,
            role: Role.TEACHER,
            status: UserStatus.ACTIVE,
          },
        });

        // 2️⃣ TEACHER PROFILE
        return tx.teacherProfile.create({
          data: {
            userId: user.id,

            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),

            paymentType: dto.paymentType,
            monthlySalary: dto.monthlySalary ?? null,
            percent: dto.percent ?? null,
          },
        });
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Phone already exists');
      }
      throw e;
    }
  }

  // ===============================
  // UPDATE
  // ===============================
  async update(id: string, dto: UpdateTeacherDto) {
    const teacher = await this.findById(id);

    this.validateSalary(dto);

    return this.prisma.$transaction(async (tx) => {
      // ===============================
      // USER UPDATE (AUTH)
      // ===============================
      const userData: Prisma.UserUpdateInput = {};

      if (dto.phone !== undefined) {
        userData.phone = dto.phone;
      }

      if (dto.password !== undefined) {
        userData.passwordHash = await argon2.hash(dto.password);
      }

      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: teacher.userId },
          data: userData,
        });
      }

      // ===============================
      // PROFILE UPDATE (DOMAIN)
      // ===============================
      const profileData: Prisma.TeacherProfileUpdateInput = {};

      // 🔥 MANA ENG MUHIM QISM
      if (dto.firstName !== undefined) {
        profileData.firstName = dto.firstName.trim();
      }

      if (dto.lastName !== undefined) {
        profileData.lastName = dto.lastName.trim();
      }

      if (dto.paymentType !== undefined) {
        profileData.paymentType = dto.paymentType;
      }

      if (dto.monthlySalary !== undefined) {
        profileData.monthlySalary = dto.monthlySalary;
        profileData.percent = null;
      }

      if (dto.percent !== undefined) {
        profileData.percent = dto.percent;
        profileData.monthlySalary = null;
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
    const teacher = await this.prisma.teacherProfile.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: { user: true },
    });

    if (!teacher) {
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
  async softDelete(id: string) {
    await this.findById(id);

    return this.prisma.teacherProfile.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });
  }
}
