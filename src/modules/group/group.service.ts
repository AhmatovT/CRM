import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AuditAction } from '@prisma/client';

@Injectable()
export class GroupsService {
  constructor(private readonly prisma: PrismaService) {}

  // ================= TIME PARSER =================
  private parseTimeToMinutes(time: string): number {
    if (!time || typeof time !== 'string') {
      throw new BadRequestException('Invalid time format');
    }

    const [hours, minutes] = time.split(':').map(Number);

    if (
      isNaN(hours) ||
      isNaN(minutes) ||
      hours < 0 ||
      hours > 23 ||
      minutes < 0 ||
      minutes > 59
    ) {
      throw new BadRequestException(
        'Time must be in HH:mm format (00:00 - 23:59)',
      );
    }

    return hours * 60 + minutes;
  }

  // ================= CREATE =================
  async create(dto: CreateGroupDto, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const trimmedName = dto.name.trim();

      const room = await tx.room.findUnique({
        where: { id: dto.roomId },
      });

      if (!room) throw new NotFoundException('Room not found');

      const existing = await tx.group.findFirst({
        where: { name: trimmedName, deletedAt: null },
      });

      if (existing) throw new ConflictException('Group name already exists');

      const start = this.parseTimeToMinutes(dto.startTime);
      const end = this.parseTimeToMinutes(dto.endTime);

      if (end <= start)
        throw new BadRequestException('End time must be after start time');

      if (end - start !== 120)
        throw new BadRequestException(
          'Lesson duration must be exactly 2 hours',
        );

      // 🔥 ROOM + WEEK CONFLICT CHECK
      const conflict = await tx.group.findFirst({
        where: {
          roomId: dto.roomId,
          deletedAt: null,
          weekPattern: dto.weekPattern,
          AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
        },
      });

      if (conflict)
        throw new ConflictException('Room already booked for this time');

      const created = await tx.group.create({
        data: {
          name: trimmedName,
          monthlyFee: dto.monthlyFee,
          capacity: dto.capacity,
          weekPattern: dto.weekPattern,
          roomId: dto.roomId,
          startTime: start,
          endTime: end,
          createdById: actorId,
          updatedById: actorId,
        },
      });

      await tx.groupHistory.create({
        data: {
          groupId: created.id,
          actorId,
          action: AuditAction.CREATE,
          newData: created,
        },
      });

      return created;
    });
  }
  // ================= FIND ALL =================
  async findAll() {
    return this.prisma.group.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        room: true,
        _count: {
          select: {
            histories: true,
            teachers: true,
          },
        },
      },
    });
  }

  // ================= FIND ONE =================
  async findOne(id: string) {
    const group = await this.prisma.group.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        room: true,
        teachers: true,
        histories: {
          orderBy: { timestamp: 'desc' },
          take: 5, // oxirgi 5 ta history
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return group;
  }

  // ================= UPDATE =================
  async update(id: string, dto: UpdateGroupDto, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const group = await tx.group.findFirst({
        where: { id, deletedAt: null },
      });

      if (!group) throw new NotFoundException('Group not found');

      const oldData = { ...group };

      const start =
        dto.startTime !== undefined
          ? this.parseTimeToMinutes(dto.startTime)
          : group.startTime;

      const end =
        dto.endTime !== undefined
          ? this.parseTimeToMinutes(dto.endTime)
          : group.endTime;

      if (end <= start)
        throw new BadRequestException('End time must be after start time');

      if (end - start !== 120)
        throw new BadRequestException(
          'Lesson duration must be exactly 2 hours',
        );

      const finalRoomId = dto.roomId ?? group.roomId;
      const finalWeekPattern = dto.weekPattern ?? group.weekPattern;

      // 🔥 Conflict check (exclude self)
      const conflict = await tx.group.findFirst({
        where: {
          roomId: finalRoomId,
          deletedAt: null,
          weekPattern: finalWeekPattern,
          id: { not: id },
          AND: [{ startTime: { lt: end } }, { endTime: { gt: start } }],
        },
      });

      if (conflict)
        throw new ConflictException('Room already booked for this time');

      const updated = await tx.group.update({
        where: { id },
        data: {
          ...dto,
          startTime: start,
          endTime: end,
          updatedById: actorId,
        },
      });

      await tx.groupHistory.create({
        data: {
          groupId: id,
          actorId,
          action: AuditAction.UPDATE,
          oldData,
          newData: updated,
        },
      });

      return updated;
    });
  }

  // ================= SOFT DELETE =================
  async softDelete(id: string, actorId: string, reason?: string) {
    return this.prisma.$transaction(async (tx) => {
      const group = await tx.group.findFirst({
        where: { id, deletedAt: null },
      });

      if (!group) throw new NotFoundException('Group not found');

      const deleted = await tx.group.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          deletedById: actorId,
          deleteReason: reason,
          isActive: false,
        },
      });

      await tx.groupHistory.create({
        data: {
          groupId: id,
          actorId,
          action: AuditAction.DELETE,
          oldData: group,
          newData: deleted,
        },
      });

      return deleted;
    });
  }

  // ================= RESTORE =================
  async restore(id: string, actorId: string) {
    return this.prisma.$transaction(async (tx) => {
      const group = await tx.group.findUnique({
        where: { id },
      });

      if (!group) throw new NotFoundException('Group not found');
      if (!group.deletedAt)
        throw new BadRequestException('Group is not deleted');

      // 🔥 Restore conflict check
      const conflict = await tx.group.findFirst({
        where: {
          roomId: group.roomId,
          deletedAt: null,
          weekPattern: group.weekPattern,
          AND: [
            { startTime: { lt: group.endTime } },
            { endTime: { gt: group.startTime } },
          ],
        },
      });

      if (conflict)
        throw new ConflictException(
          'Cannot restore: room already booked for this time',
        );

      const restored = await tx.group.update({
        where: { id },
        data: {
          deletedAt: null,
          deletedById: null,
          deleteReason: null,
          isActive: true,
        },
      });

      await tx.groupHistory.create({
        data: {
          groupId: id,
          actorId,
          action: AuditAction.RESTORE,
          newData: restored,
        },
      });

      return restored;
    });
  }

  // ================= HISTORY =================
  async getHistory(id: string) {
    const group = await this.prisma.group.findUnique({
      where: { id },
    });

    if (!group) throw new NotFoundException('Group not found');

    return this.prisma.groupHistory.findMany({
      where: { groupId: id },
      orderBy: { timestamp: 'desc' },
      include: {
        actor: {
          select: {
            id: true,
            role: true,
          },
        },
      },
    });
  }
}
