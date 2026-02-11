import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupQueryDto } from './dto/group-query.dto';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  // CREATE
  async create(dto: CreateGroupDto) {
    return this.prisma.group.create({
      data: {
        name: dto.name,
        price: dto.price,
        capacity: dto.capacity,
        teacherId: dto.teacherId,
        roomId: dto.roomId,
      },
    });
  }

  // LIST (pagination + filter)
  async findAll(query: GroupQueryDto) {
    const { search, isActive, page = 1, limit = 10 } = query;

    const where = {
      deletedAt: null,
      ...(typeof isActive === 'boolean' && { isActive }),
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive' as const,
        },
      }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.group.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.group.count({ where }),
    ]);

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // GET ONE
  async findOne(id: string) {
    const group = await this.prisma.group.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group;
  }

  // UPDATE
  async update(id: string, dto: UpdateGroupDto) {
    await this.findOne(id);

    return this.prisma.group.update({
      where: { id },
      data: {
        name: dto.name,
        price: dto.price,
        capacity: dto.capacity,
        //teacherId: dto.teacherId,
        roomId: dto.roomId,
        //isActive: dto.isActive,
      },
    });
  }

  // SOFT DELETE
  async softDelete(id: string, actorId: string, reason?: string) {
    await this.findOne(id);

    return this.prisma.group.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: actorId,
        deleteReason: reason,
        isActive: false,
      },
    });
  }
}
