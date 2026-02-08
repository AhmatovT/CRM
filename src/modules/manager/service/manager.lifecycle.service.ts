import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateManagerDto } from '../dto/create-manager.dto';
import { PrismaService } from 'prisma/prisma.service';
import { hashPassword } from 'src/common/password.util';

@Injectable()
export class ManagerLifecycleService {
  constructor(private readonly prisma: PrismaService) {}

  // ADMIN → Manager yaratadi

  async create(dto: CreateManagerDto) {
    return this.prisma.$transaction(async (tx) => {
      const hashedPassword = await hashPassword(dto.password);

      const user = await tx.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          phone: dto.phone,
          password: hashedPassword, // 👈 ARGON2
          role: 'MANAGER',
        },
      });

      const manager = await tx.managerProfile.create({
        data: {
          userId: user.id,
          note: dto.note,
        },
      });

      return {
        id: manager.id,
        userId: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        note: manager.note,
        createdAt: manager.createdAt,
      };
    });
  }
  // ADMIN → Manager deactivate (soft delete)
  async deactivate(managerId: string, deletedById: string, reason?: string) {
    const manager = await this.prisma.managerProfile.findFirst({
      where: { id: managerId, deletedAt: null },
    });

    if (!manager) {
      throw new NotFoundException('Manager not found or already deactivated');
    }

    return this.prisma.managerProfile.update({
      where: { id: managerId },
      data: {
        isActive: false,
        deletedAt: new Date(),
        deletedById,
        deleteReason: reason,
      },
    });
  }
}
