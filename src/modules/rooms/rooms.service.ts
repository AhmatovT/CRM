import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'prisma/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';

type RoomSelect = {
  id: true;
  name: true;
  capacity: true;
  isActive: true;
  createdAt: true;
  updatedAt: true;
};

const ROOM_SELECT: RoomSelect = {
  id: true,
  name: true,
  capacity: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  private ensureId(id: string): string {
    const v = (id ?? '').trim();
    if (!v) throw new BadRequestException('id bo‘sh');
    return v;
  }

  // nameNormalized yo‘q -> faqat trim (minimal)
  private cleanName(name: string): string {
    const v = (name ?? '').trim();
    if (!v)
      throw new BadRequestException('Xona nomi bo‘sh bo‘lishi mumkin emas');
    return v;
  }

  private ensureCapacity(value: unknown): number {
    const n = Number(value);

    if (!Number.isFinite(n))
      throw new BadRequestException('Capacity noto‘g‘ri');
    if (!Number.isInteger(n))
      throw new BadRequestException('Capacity butun son bo‘lishi kerak');
    if (n < 1 || n > 500)
      throw new BadRequestException(
        'Capacity 1..500 oralig‘ida bo‘lishi kerak',
      );

    return n;
  }

  private async assertUniqueName(name: string, exceptId?: string) {
    const existing = await this.prisma.room.findFirst({
      where: {
        name,
        deletedAt: null,
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      select: { id: true },
    });

    if (existing)
      throw new ConflictException('Bunday xona nomi allaqachon mavjud');
  }

  async create(dto: CreateRoomDto) {
    const name = this.cleanName(dto.name);
    const capacity = this.ensureCapacity(dto.capacity);

    try {
      // transaction: create paytida
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.room.findFirst({
          where: { name, deletedAt: null },
          select: { id: true },
        });
        if (existing)
          throw new ConflictException('Bunday xona nomi allaqachon mavjud');

        return tx.room.create({
          data: {
            name,
            capacity,
            isActive: true,
          },
          select: ROOM_SELECT,
        });
      });
    } catch (e) {
      // race-condition bo‘lsa: DB unique -> P2002
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      )
        throw new ConflictException('Bunday xona nomi allaqachon mavjud');

      throw e;
    }
  }

  async list() {
    return this.prisma.room.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: ROOM_SELECT,
    });
  }

  async getOne(id: string) {
    const roomId = this.ensureId(id);

    const room = await this.prisma.room.findFirst({
      where: { id: roomId, deletedAt: null },
      select: ROOM_SELECT,
    });

    if (!room) throw new NotFoundException('Room topilmadi');
    return room;
  }

  async update(id: string, dto: UpdateRoomDto) {
    const roomId = this.ensureId(id);

    const prev = await this.prisma.room.findFirst({
      where: { id: roomId, deletedAt: null },
      select: { id: true },
    });
    if (!prev) throw new NotFoundException('Room topilmadi');

    const data: Prisma.RoomUpdateInput = {};

    if (dto.name !== undefined) {
      const name = this.cleanName(dto.name);
      await this.assertUniqueName(name, roomId);
      data.name = name;
    }

    if (dto.capacity !== undefined) {
      const capacity = this.ensureCapacity(dto.capacity);
      data.capacity = capacity;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('Hech qanday field yuborilmadi');
    }

    try {
      return await this.prisma.room.update({
        where: { id: roomId },
        data,
        select: ROOM_SELECT,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      )
        throw new ConflictException('Bunday xona nomi allaqachon mavjud');

      throw e;
    }
  }

  async softDelete(id: string) {
    const roomId = this.ensureId(id);

    const prev = await this.prisma.room.findFirst({
      where: { id: roomId, deletedAt: null },
      select: { id: true },
    });
    if (!prev) throw new NotFoundException('Room topilmadi');

    return this.prisma.room.update({
      where: { id: roomId },
      data: { deletedAt: new Date(), isActive: false },
      select: { id: true, deletedAt: true, isActive: true },
    });
  }
}
