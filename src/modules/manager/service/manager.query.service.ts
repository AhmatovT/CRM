import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class ManagerQueryService {
  constructor(private readonly prisma: PrismaService) {}

  getAll() {
    return this.prisma.managerProfile.findMany({
      where: { deletedAt: null },
      include: { user: true },
    });
  }

  async getById(id: string) {
    const manager = await this.prisma.managerProfile.findFirst({
      where: { id, deletedAt: null },
      include: { user: true },
    });

    if (!manager) {
      throw new NotFoundException('Manager not found');
    }

    return manager;
  }
}
