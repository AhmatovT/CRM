import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import * as argon2 from 'argon2';
import { Prisma, Role, UserStatus } from '@prisma/client';

@Injectable()
export class StudentProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStudentDto) {
    const passwordHash = dto.password ? await argon2.hash(dto.password) : null;

    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1️⃣ USER
        const user = await tx.user.create({
          data: {
            phone: dto.phone,
            passwordHash,
            role: Role.STUDENT,
            status: UserStatus.ACTIVE,
          },
        });

        // 2️⃣ STUDENT PROFILE
        return tx.studentProfile.create({
          data: {
            userId: user.id,
            firstName: dto.firstName,
            lastName: dto.lastName,
            address: dto.address,
            idCard: dto.idCard,
            photoUrl: dto.photoUrl,
          },
        });
      });
    } catch (error) {
      // 🔥 UNIQUE constraint
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Phone number already exists');
      }

      throw error;
    }
  }
  async getAll() {
    const students = await this.prisma.studentProfile.findMany({
      where: { deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return students.map((s) => ({
      id: s.id,
      userId: s.user.id, // 🔥 userId alohida
      phone: s.user.phone,
      role: s.user.role,
      firstName: s.firstName,
      lastName: s.lastName,
      address: s.address,
      idCard: s.idCard,
      photoUrl: s.photoUrl,
      isActive: s.isActive,
      createdAt: s.createdAt,
    }));
  }

  async findById(id: string) {
    return this.prisma.studentProfile.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  async update(id: string, dto: UpdateStudentDto) {
    return this.prisma.studentProfile.update({
      where: { id },
      data: dto,
    });
  }

  async softDelete(studentId: string, adminId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { id: studentId },
    });

    if (!student || student.deletedAt) {
      throw new NotFoundException('Student profile not found');
    }

    return this.prisma.studentProfile.update({
      where: { id: studentId },
      data: {
        isActive: false,
        deletedAt: new Date(),
        deletedById: adminId,
      },
    });
  }
  async restore(studentId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { id: studentId },
    });

    if (!student || !student.deletedAt) {
      throw new NotFoundException('Deleted student not found');
    }

    return this.prisma.studentProfile.update({
      where: { id: studentId },
      data: {
        deletedAt: null,
        deletedById: null,
        deleteReason: null,
        isActive: true,
      },
    });
  }

  async getDeleteHistory() {
    const deletedStudents = await this.prisma.studentProfile.findMany({
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

    return deletedStudents.map((s) => ({
      studentId: s.id,
      firstName: s.firstName,
      lastName: s.lastName,
      deletedAt: s.deletedAt,
      deletedById: s.deletedById,
      deletedByRole: s.deletedBy?.role,
      deletedByPhone: s.deletedBy?.phone,
    }));
  }
}
