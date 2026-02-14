import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { QueryEnrollmentDto } from './dto/query-enrollment.dto';
import { EnrollmentStatus, Prisma } from '@prisma/client';

@Injectable()
export class EnrollmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly select = {
    id: true,
    studentId: true,
    groupId: true,
    status: true,
    startedAt: true,
    endedAt: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  async create(actorId: string, dto: CreateEnrollmentDto) {
    if (!actorId?.trim()) {
      throw new BadRequestException('Actor aniqlanmadi');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        // 1️⃣ Student tekshirish
        const student = await tx.studentProfile.findUnique({
          where: { id: dto.studentId },
          select: { id: true, isActive: true, deletedAt: true },
        });

        if (!student || student.deletedAt || !student.isActive) {
          throw new NotFoundException('O‘quvchi topilmadi yoki aktiv emas');
        }

        // 2️⃣ Group tekshirish
        const group = await tx.group.findUnique({
          where: { id: dto.groupId },
          select: { id: true, capacity: true, isActive: true, deletedAt: true },
        });

        if (!group || group.deletedAt || !group.isActive) {
          throw new NotFoundException('Guruh topilmadi yoki aktiv emas');
        }

        // 3️⃣ Duplicate ACTIVE enrollment tekshirish
        const exists = await tx.enrollment.findFirst({
          where: {
            studentId: dto.studentId,
            groupId: dto.groupId,
            status: EnrollmentStatus.ACTIVE,
            deletedAt: null,
          },
          select: { id: true },
        });

        if (exists) {
          throw new BadRequestException(
            'O‘quvchi allaqachon shu guruhda (ACTIVE)',
          );
        }

        // 4️⃣ Capacity tekshirish
        const activeCount = await tx.enrollment.count({
          where: {
            groupId: dto.groupId,
            status: EnrollmentStatus.ACTIVE,
            deletedAt: null,
          },
        });

        if (activeCount >= group.capacity) {
          throw new ForbiddenException('Guruh to‘lib qolgan');
        }

        // 5️⃣ Create enrollment
        return await tx.enrollment.create({
          data: {
            studentId: dto.studentId,
            groupId: dto.groupId,
            status: EnrollmentStatus.ACTIVE,
          },
          select: this.select,
        });
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new BadRequestException('Duplicate enrollment');
        }
        if (e.code === 'P2003') {
          throw new BadRequestException(
            'Student yoki Group ID noto‘g‘ri',
          );
        }
      }
      throw e;
    }
  }

  async findAll(query: QueryEnrollmentDto) {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit =
      query.limit && query.limit > 0 ? Math.min(query.limit, 50) : 10;

    const where: Prisma.EnrollmentWhereInput = {
      deletedAt: null,
      ...(query.studentId ? { studentId: query.studentId } : {}),
      ...(query.groupId ? { groupId: query.groupId } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.enrollment.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: this.select,
      }),
      this.prisma.enrollment.count({ where }),
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

  async findOne(id: string) {
    const enrollment = await this.prisma.enrollment.findFirst({
      where: { id, deletedAt: null },
      select: this.select,
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment topilmadi');
    }

    return enrollment;
  }

  async updateStatus(actorId: string, id: string, next: EnrollmentStatus) {
    if (!actorId?.trim()) {
      throw new BadRequestException('Actor aniqlanmadi');
    }

    if (
      next !== EnrollmentStatus.DROPPED &&
      next !== EnrollmentStatus.COMPLETED
    ) {
      throw new BadRequestException(
        'Status faqat DROPPED yoki COMPLETED bo‘lishi mumkin',
      );
    }

    const prev = await this.prisma.enrollment.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true },
    });

    if (!prev) {
      throw new NotFoundException('Enrollment topilmadi');
    }

    if (prev.status !== EnrollmentStatus.ACTIVE) {
      throw new BadRequestException(
        'Faqat ACTIVE enrollment status o‘zgartiriladi',
      );
    }

    return this.prisma.enrollment.update({
      where: { id },
      data: {
        status: next,
        endedAt: new Date(),
      },
      select: this.select,
    });
  }

  async softDelete(actorId: string, id: string, reason?: string) {
    if (!actorId?.trim()) {
      throw new BadRequestException('Actor aniqlanmadi');
    }

    await this.findOne(id);

    return this.prisma.enrollment.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedById: actorId,
        deleteReason: reason ?? 'manual delete',
      },
      select: this.select,
    });
  }
}
