import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';
import * as argon2 from 'argon2';
import { Prisma, Role, UserStatus } from '@prisma/client';

@Injectable()
export class ManagerService {
  constructor(private readonly prisma: PrismaService) {}

  // Faqat kerakli user fieldlarni qaytaramiz (passwordHash NEVER)
  private readonly managerWithUserSelect =
    Prisma.validator<Prisma.ManagerProfileDefaultArgs>()({
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            role: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

  // -----------------------------
  // Utils
  // -----------------------------
  private parseDateOrThrow(value: string, field = 'birthDate'): Date {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
      throw new BadRequestException(`${field} is invalid`);
    }
    return d;
  }

  private normalizePhone(phone: string): string {
    // xohlasangiz +998 format qat'iy regex qo'shasiz
    return phone.trim();
  }

  private sanitizeText(value?: string | null): string | null {
    if (value === undefined) return null;
    if (value === null) return null;
    const v = value.trim();
    return v.length ? v : null;
  }

  // -----------------------------
  // Create
  // -----------------------------
  async create(dto: CreateManagerDto) {
    const phone = this.normalizePhone(dto.phone);

    const existing = await this.prisma.user.findUnique({
      where: { phone },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Phone already exists');
    }

    if (dto.salary < 0) {
      throw new BadRequestException('Salary cannot be negative');
    }

    const birthDate = this.parseDateOrThrow(dto.birthDate);
    const passwordHash = await argon2.hash(dto.password);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            phone,
            passwordHash,
            role: Role.MANAGER,
            status: UserStatus.ACTIVE,
          },
          select: { id: true },
        });

        const manager = await tx.managerProfile.create({
          data: {
            userId: user.id,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            gender: dto.gender,
            birthDate,
            photoUrl: this.sanitizeText(dto.photoUrl),
            salary: dto.salary,
            note: this.sanitizeText(dto.note),
            isActive: true,
          },
          ...this.managerWithUserSelect,
        });

        return manager;
      });
    } catch (e) {
      // race condition uchun ham ushlaymiz
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        throw new ConflictException('Phone already exists');
      }
      throw e;
    }
  }

  // -----------------------------
  // Read
  // -----------------------------
  async getAll(page = 1, limit = 20) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));

    const where: Prisma.ManagerProfileWhereInput = { deletedAt: null };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.managerProfile.findMany({
        where,
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        ...this.managerWithUserSelect,
      }),
      this.prisma.managerProfile.count({ where }),
    ]);

    return {
      items,
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }

  async getById(id: string) {
    const manager = await this.prisma.managerProfile.findFirst({
      where: { id, deletedAt: null },
      ...this.managerWithUserSelect,
    });

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    return manager;
  }

  // -----------------------------
  // Update
  // -----------------------------
  async update(id: string, dto: UpdateManagerDto) {
    const manager = await this.prisma.managerProfile.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, userId: true },
    });

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    // Pre-validation
    let normalizedPhone: string | undefined;
    if (dto.phone !== undefined) {
      normalizedPhone = this.normalizePhone(dto.phone);
      const phoneOwner = await this.prisma.user.findUnique({
        where: { phone: normalizedPhone },
        select: { id: true },
      });
      if (phoneOwner && phoneOwner.id !== manager.userId) {
        throw new ConflictException('Phone already exists');
      }
    }

    let parsedBirthDate: Date | undefined;
    if (dto.birthDate !== undefined) {
      parsedBirthDate = this.parseDateOrThrow(dto.birthDate);
    }

    if (dto.salary !== undefined && dto.salary < 0) {
      throw new BadRequestException('Salary cannot be negative');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const userData: Prisma.UserUpdateInput = {};
        if (normalizedPhone !== undefined) userData.phone = normalizedPhone;
        if (dto.password !== undefined) {
          userData.passwordHash = await argon2.hash(dto.password);
        }

        if (Object.keys(userData).length > 0) {
          await tx.user.update({
            where: { id: manager.userId },
            data: userData,
          });
        }

        const profileData: Prisma.ManagerProfileUpdateInput = {};
        if (dto.firstName !== undefined)
          profileData.firstName = dto.firstName.trim();
        if (dto.lastName !== undefined)
          profileData.lastName = dto.lastName.trim();
        if (dto.gender !== undefined) profileData.gender = dto.gender;
        if (parsedBirthDate !== undefined)
          profileData.birthDate = parsedBirthDate;
        if (dto.photoUrl !== undefined)
          profileData.photoUrl = this.sanitizeText(dto.photoUrl);
        if (dto.salary !== undefined) profileData.salary = dto.salary;
        if (dto.note !== undefined)
          profileData.note = this.sanitizeText(dto.note);

        const updated = await tx.managerProfile.update({
          where: { id },
          data: profileData,
          ...this.managerWithUserSelect,
        });

        return updated;
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

  // -----------------------------
  // Soft Delete / Restore
  // -----------------------------
  async softDelete(id: string, adminId: string) {
    const manager = await this.prisma.managerProfile.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });

    if (!manager) {
      throw new NotFoundException('Manager not found or already deleted');
    }

    const updated = await this.prisma.managerProfile.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
        deletedById: adminId,
      },
      select: {
        deletedAt: true,
        deletedById: true,
      },
    });

    return updated;
  }

  async restore(id: string) {
    const manager = await this.prisma.managerProfile.findUnique({
      where: { id },
      select: { id: true, userId: true, deletedAt: true },
    });

    if (!manager || !manager.deletedAt) {
      throw new NotFoundException('Deleted manager not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const restored = await tx.managerProfile.update({
        where: { id },
        data: {
          isActive: true,
          deletedAt: null,
          deletedById: null,
          deleteReason: null,
        },
        ...this.managerWithUserSelect,
      });

      await tx.user.update({
        where: { id: manager.userId },
        data: { status: UserStatus.ACTIVE },
      });

      return restored;
    });
  }

  // -----------------------------
  // Delete History
  // -----------------------------
  async getDeleteHistory(page = 1, limit = 20) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));

    const where: Prisma.ManagerProfileWhereInput = {
      deletedAt: { not: null },
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.managerProfile.findMany({
        where,
        skip: (safePage - 1) * safeLimit,
        take: safeLimit,
        include: {
          deletedBy: {
            select: {
              id: true,
              role: true,
              phone: true,
            },
          },
          user: {
            select: {
              id: true,
              phone: true,
            },
          },
        },
        orderBy: { deletedAt: 'desc' },
      }),
      this.prisma.managerProfile.count({ where }),
    ]);

    return {
      items: items.map((m) => ({
        managerId: m.id,
        userId: m.userId,
        firstName: m.firstName,
        lastName: m.lastName,
        phone: m.user?.phone ?? null,
        deletedAt: m.deletedAt,
        deletedById: m.deletedById,
        deletedByRole: m.deletedBy?.role ?? null,
        deletedByPhone: m.deletedBy?.phone ?? null,
        deleteReason: m.deleteReason ?? null,
      })),
      meta: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }
}
