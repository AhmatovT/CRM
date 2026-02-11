import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import * as argon2 from 'argon2';
import { Role, UserStatus } from '@prisma/client';

@Injectable()
export class StudentProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateStudentDto) {
    const passwordHash = dto.password ? await argon2.hash(dto.password) : null;

    return this.prisma.$transaction(async (tx) => {
      // 1️⃣ USER (AUTH)
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
  }
  async getAll() {
    return this.prisma.studentProfile.findMany({
      where: {
        deletedAt: null,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        address: true,
        idCard: true,
        photoUrl: true,
        isActive: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            phone: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
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
}
