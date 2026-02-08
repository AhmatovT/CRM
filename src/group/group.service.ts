import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateGroupDto) {
    return this.prisma.group.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.group.findMany({
      where: { deletedAt: null },
      include: { room: true },
    });
  }

  async findOne(id: string) {
    const group = await this.prisma.group.findFirst({
      where: { id, deletedAt: null },
    });

    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  async update(id: string, dto: UpdateGroupDto) {
    await this.findOne(id);

    return this.prisma.group.update({
      where: { id },
      data: dto,
    });
  }

  async softDelete(id: string, actorId: string, reason?: string) {
    await this.findOne(id);

    return this.prisma.group.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: actorId,
        deleteReason: reason,
      },
    });
  }
}
