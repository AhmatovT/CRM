import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';
import { Role, UserStatus, Prisma } from '@prisma/client';
import * as argon2 from 'argon2';

@Injectable()
export class ManagerService {
  constructor(private readonly prisma: PrismaService) {}

  // ===============================
  // CREATE
  // ===============================
  async create(dto: CreateManagerDto) {
    const existing = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (existing) {
      throw new ConflictException('Phone already exists');
    }

    const passwordHash = await argon2.hash(dto.password);

    return this.prisma.$transaction(async (tx) => {
      // 1️⃣ USER (AUTH)
      const user = await tx.user.create({
        data: {
          phone: dto.phone,
          passwordHash,
          role: Role.MANAGER,
          status: UserStatus.ACTIVE,
        },
      });

      // 2️⃣ MANAGER PROFILE
      const manager = await tx.managerProfile.create({
        data: {
          userId: user.id,
          firstName: dto.firstName.trim(),
          lastName: dto.lastName.trim(),
          note: dto.note ?? null,
          isActive: true,
        },
      });

      return this.mapResponse(manager, user);
    });
  }

  // ===============================
  // GET ALL
  // ===============================
  async getAll() {
    const managers = await this.prisma.managerProfile.findMany({
      where: { deletedAt: null },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    return managers.map((m) => this.mapResponse(m, m.user));
  }

  // ===============================
  // GET BY ID
  // ===============================
  async getById(id: string) {
    const manager = await this.prisma.managerProfile.findFirst({
      where: { id, deletedAt: null },
      include: { user: true },
    });

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    return this.mapResponse(manager, manager.user);
  }

  // ===============================
  // UPDATE
  // ===============================
  async update(id: string, dto: UpdateManagerDto) {
    const manager = await this.prisma.managerProfile.findFirst({
      where: { id, deletedAt: null },
      include: { user: true },
    });

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    return this.prisma.$transaction(async (tx) => {
      // USER UPDATE
      const userData: Prisma.UserUpdateInput = {};

      if (dto.phone !== undefined) {
        userData.phone = dto.phone;
      }

      if (dto.password !== undefined) {
        userData.passwordHash = await argon2.hash(dto.password);
      }

      if (Object.keys(userData).length > 0) {
        await tx.user.update({
          where: { id: manager.userId },
          data: userData,
        });
      }

      // PROFILE UPDATE
      const profileData: Prisma.ManagerProfileUpdateInput = {};

      if (dto.firstName !== undefined) {
        profileData.firstName = dto.firstName.trim();
      }

      if (dto.lastName !== undefined) {
        profileData.lastName = dto.lastName.trim();
      }

      if (dto.note !== undefined) {
        profileData.note = dto.note;
      }

      return tx.managerProfile.update({
        where: { id },
        data: profileData,
        include: { user: true },
      });
    });
  }

  // ===============================
  // SOFT DELETE
  // ===============================
  async softDelete(id: string, adminId?: string) {
    const manager = await this.prisma.managerProfile.findFirst({
      where: { id, deletedAt: null },
    });

    if (!manager) {
      throw new NotFoundException('Manager not found or already deleted');
    }

    await this.prisma.managerProfile.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
        deletedById: adminId ?? null,
      },
    });

    return { success: true };
  }

  // ===============================
  // RESPONSE MAPPER
  // ===============================
  private mapResponse(manager: any, user: any) {
    return {
      id: manager.id,
      userId: user.id,
      firstName: manager.firstName,
      lastName: manager.lastName,
      phone: user.phone,
      note: manager.note,
      isActive: manager.isActive,
      createdAt: manager.createdAt,
    };
  }
}
