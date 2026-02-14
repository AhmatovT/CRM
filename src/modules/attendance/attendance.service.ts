import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { EnrollmentStatus, Prisma } from '@prisma/client';

import {
  OpenAttendanceSessionDto,
  FinalizeAttendanceDto,
} from './dto/session.dto';
import { MarkAttendanceDto, BulkAttendanceDto } from './dto/attendance.dto';
import { AttendanceMonthlyDto } from './dto/query.dto';

type SessionStatus = 'OPEN' | 'LOCKED';
type AttendanceStatusStr = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
type AttendanceSourceStr = 'TEACHER' | 'SYSTEM';

function toLocalDateOnly(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addMinutes(dateOnly: Date, minutes: number) {
  const d = new Date(dateOnly);
  d.setHours(0, 0, 0, 0);
  d.setMinutes(minutes);
  return d;
}
function parseMonthOrThrow(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new BadRequestException('month formati YYYY-MM bo‘lishi kerak');
  }
  const [yStr, mStr] = month.split('-');
  const y = Number(yStr);
  const m = Number(mStr);
  if (!Number.isInteger(y) || !Number.isInteger(m) || m < 1 || m > 12) {
    throw new BadRequestException('month noto‘g‘ri');
  }
  const from = new Date(y, m - 1, 1, 0, 0, 0, 0);
  const to = new Date(y, m, 1, 0, 0, 0, 0);
  return { from, to };
}

function assertGroupLessonWindow(startMin: number, endMin: number) {
  if (!Number.isInteger(startMin) || !Number.isInteger(endMin)) {
    throw new BadRequestException('Guruh dars vaqti noto‘g‘ri (integer emas)');
  }
  if (startMin < 0 || startMin > 1439) {
    throw new BadRequestException(
      'lessonStartMin 0..1439 oralig‘ida bo‘lishi kerak',
    );
  }
  if (endMin < 1 || endMin > 1440) {
    throw new BadRequestException(
      'lessonEndMin 1..1440 oralig‘ida bo‘lishi kerak',
    );
  }
  if (startMin >= endMin) {
    throw new BadRequestException(
      'lessonStartMin < lessonEndMin bo‘lishi kerak',
    );
  }
}

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly sessionSelect = {
    id: true,
    groupId: true,
    teacherId: true,
    roomId: true,
    date: true,
    startMin: true,
    endMin: true,
    openAt: true,
    closeAt: true,
    status: true,
    lockedAt: true,
    lockedById: true,
    finalizedAt: true,
    finalizedById: true,
    note: true,
    createdAt: true,
    updatedAt: true,
    teacher: { select: { userId: true } },
  } as const;

  private readonly attendanceSelect = {
    id: true,
    sessionId: true,
    studentId: true,
    status: true,
    comment: true,
    markedById: true,
    markedAt: true,
    updatedAt: true,
    source: true,
  } as const;

  private assertTeacher(actorId: string, teacherUserId: string) {
    if (!actorId?.trim())
      throw new BadRequestException('x-actor-id header yo‘q');
    if (actorId !== teacherUserId) {
      throw new ForbiddenException(
        'Davomatni faqat shu guruh o‘qituvchisi qila oladi',
      );
    }
  }

  // ✅ closeAt o‘tib ketgan bo‘lsa, session DB’da LOCK bo‘ladi
  private async autoLockIfNeeded(
    tx: Prisma.TransactionClient,
    sessionId: string,
  ) {
    const now = new Date();
    await tx.attendanceSession.updateMany({
      where: {
        id: sessionId,
        status: 'OPEN',
        closeAt: { lte: now },
      },
      data: {
        status: 'LOCKED',
        lockedAt: now,
      },
    });
  }

  private assertWindowOpen(session: {
    openAt: Date;
    closeAt: Date;
    lockedAt: Date | null;
    status: SessionStatus | string;
  }) {
    if (session.lockedAt || session.status === 'LOCKED') {
      throw new ForbiddenException('Davomat yopilgan, qayta ochilmaydi');
    }
    const now = new Date();
    if (now < session.openAt)
      throw new ForbiddenException('Davomat hali ochilmagan');
    if (now >= session.closeAt)
      throw new ForbiddenException('Davomat yopilgan (dars tugagan)');
  }

  // ===== 1) OPEN SESSION =====
  // async openSession(actorId: string, dto: OpenAttendanceSessionDto) {
  //   if (!actorId?.trim())
  //     throw new BadRequestException('x-actor-id header yo‘q');

  //   const today = toLocalDateOnly(new Date());
  //   const dateOnly = dto.date ? toLocalDateOnly(new Date(dto.date)) : today;

  //   if (dateOnly.getTime() !== today.getTime()) {
  //     throw new BadRequestException('Sessiya faqat bugungi kun uchun ochiladi');
  //   }

  //   return this.prisma.$transaction(async (tx) => {
  //     const group = await tx.group.findFirst({
  //       where: { id: dto.groupId, deletedAt: null, isActive: true },
  //       select: {
  //         id: true,
  //         // teacherId: true,
  //         roomId: true,
  //         startTime: true,
  //         endTime: true,
  //         // teacher: { select: { userId: true } },
  //       },
  //     });
  //     if (!group)
  //       throw new NotFoundException('Guruh topilmadi yoki aktiv emas');

  //     // this.assertTeacher(actorId, group.teacher.userId); ///////////////togirla teacher .userId ni group modelga qarab///////////////////////

  //     assertGroupLessonWindow(group.startTime, group.endTime);

  //     const startMin = group.startTime;
  //     const endMin = group.endTime;

  //     const openAt = addMinutes(dateOnly, startMin);
  //     const closeAt = addMinutes(dateOnly, endMin);

  //     const now = new Date();
  //     if (now < openAt) throw new ForbiddenException('Davomat hali ochilmagan');
  //     if (now >= closeAt)
  //       throw new ForbiddenException('Davomat yopilgan (dars tugagan)');

  //     const exists = await tx.attendanceSession.findUnique({
  //       where: { groupId_date: { groupId: group.id, date: dateOnly } },
  //       select: this.sessionSelect,
  //     });

  //     if (exists) {
  //       // closeAt o‘tib ketgan bo‘lsa lock qilib qaytar
  //       if (new Date() >= exists.closeAt && exists.status !== 'LOCKED') {
  //         return tx.attendanceSession.update({
  //           where: { id: exists.id },
  //           data: { status: 'LOCKED', lockedAt: exists.lockedAt ?? new Date() },
  //           select: this.sessionSelect,
  //         });
  //       }
  //       return exists;
  //     }

  //     return tx.attendanceSession.create({
  //       data: {
  //         groupId: group.id,
  //         roomId: group.roomId,
  //         date: dateOnly,
  //         startMin,
  //         endMin,
  //         openAt,
  //         closeAt,
  //         status: 'OPEN',
  //         note: dto.note?.trim()?.slice(0, 200) || null,
  //       },
  //       select: this.sessionSelect,
  //     });
  //   });
  // }

  // ===== 2) MARK =====
  async mark(actorId: string, dto: MarkAttendanceDto) {
    if (!actorId?.trim())
      throw new BadRequestException('x-actor-id header yo‘q');

    return this.prisma.$transaction(async (tx) => {
      await this.autoLockIfNeeded(tx, dto.sessionId);

      const session = await tx.attendanceSession.findUnique({
        where: { id: dto.sessionId },
        select: {
          id: true,
          groupId: true,
          openAt: true,
          closeAt: true,
          lockedAt: true,
          status: true,
          teacher: { select: { userId: true } },
        },
      });
      if (!session) throw new NotFoundException('Davomat sessiyasi topilmadi');

      this.assertTeacher(actorId, session.teacher.userId);
      this.assertWindowOpen(session);

      const active = await tx.enrollment.findFirst({
        where: {
          groupId: session.groupId,
          studentId: dto.studentId,
          status: EnrollmentStatus.ACTIVE,
          deletedAt: null,
        },
        select: { id: true },
      });
      if (!active)
        throw new BadRequestException('Student bu guruhda ACTIVE emas');

      const status = dto.status as unknown as AttendanceStatusStr;

      return tx.attendance.upsert({
        where: {
          sessionId_studentId: {
            sessionId: session.id,
            studentId: dto.studentId,
          },
        },
        create: {
          sessionId: session.id,
          studentId: dto.studentId,
          status,
          comment: dto.comment?.trim()?.slice(0, 200) || null,
          markedById: actorId,
          source: 'TEACHER' as AttendanceSourceStr,
        },
        update: {
          status,
          comment: dto.comment?.trim()?.slice(0, 200) || null,
          markedById: actorId,
          source: 'TEACHER' as AttendanceSourceStr,
        },
        select: this.attendanceSelect,
      });
    });
  }

  // ===== 3) BULK =====
  async bulkMark(actorId: string, dto: BulkAttendanceDto) {
    if (!actorId?.trim())
      throw new BadRequestException('x-actor-id header yo‘q');
    if (!dto.items?.length) throw new BadRequestException('Items bo‘sh');

    return this.prisma.$transaction(async (tx) => {
      await this.autoLockIfNeeded(tx, dto.sessionId);

      const session = await tx.attendanceSession.findUnique({
        where: { id: dto.sessionId },
        select: {
          id: true,
          groupId: true,
          openAt: true,
          closeAt: true,
          lockedAt: true,
          status: true,
          teacher: { select: { userId: true } },
        },
      });
      if (!session) throw new NotFoundException('Davomat sessiyasi topilmadi');

      this.assertTeacher(actorId, session.teacher.userId);
      this.assertWindowOpen(session);

      const activeStudents = await tx.enrollment.findMany({
        where: {
          groupId: session.groupId,
          status: EnrollmentStatus.ACTIVE,
          deletedAt: null,
        },
        select: { studentId: true },
      });
      const activeSet = new Set(activeStudents.map((x) => x.studentId));

      let written = 0;
      let skipped = 0;

      for (const it of dto.items) {
        if (!activeSet.has(it.studentId)) {
          skipped++;
          continue;
        }

        const status = it.status as unknown as AttendanceStatusStr;

        await tx.attendance.upsert({
          where: {
            sessionId_studentId: {
              sessionId: session.id,
              studentId: it.studentId,
            },
          },
          create: {
            sessionId: session.id,
            studentId: it.studentId,
            status,
            comment: it.comment?.trim()?.slice(0, 200) || null,
            markedById: actorId,
            source: 'TEACHER' as AttendanceSourceStr,
          },
          update: {
            status,
            comment: it.comment?.trim()?.slice(0, 200) || null,
            markedById: actorId,
            source: 'TEACHER' as AttendanceSourceStr,
          },
          select: { id: true },
        });

        written++;
      }

      return { ok: true, written, skipped };
    });
  }

  // ===== 4) FINALIZE + AUTO ABSENT + LOCK =====
  async finalize(actorId: string, dto: FinalizeAttendanceDto) {
    if (!actorId?.trim())
      throw new BadRequestException('x-actor-id header yo‘q');

    return this.prisma.$transaction(async (tx) => {
      await this.autoLockIfNeeded(tx, dto.sessionId);

      const session = await tx.attendanceSession.findUnique({
        where: { id: dto.sessionId },
        select: {
          id: true,
          groupId: true,
          openAt: true,
          closeAt: true,
          lockedAt: true,
          status: true,
          finalizedAt: true,
          teacher: { select: { userId: true } },
        },
      });
      if (!session) throw new NotFoundException('Davomat sessiyasi topilmadi');

      this.assertTeacher(actorId, session.teacher.userId);
      this.assertWindowOpen(session);

      if (session.finalizedAt) {
        throw new ForbiddenException('Session allaqachon finalized qilingan');
      }

      const active = await tx.enrollment.findMany({
        where: {
          groupId: session.groupId,
          status: EnrollmentStatus.ACTIVE,
          deletedAt: null,
        },
        select: { studentId: true },
      });

      const marked = await tx.attendance.findMany({
        where: { sessionId: session.id },
        select: { studentId: true },
      });
      const markedSet = new Set(marked.map((x) => x.studentId));

      const missing = active.filter((s) => !markedSet.has(s.studentId));

      if (missing.length) {
        await tx.attendance.createMany({
          data: missing.map((s) => ({
            sessionId: session.id,
            studentId: s.studentId,
            status: 'ABSENT' as AttendanceStatusStr,
            comment: null,
            markedById: actorId,
            source: 'SYSTEM' as AttendanceSourceStr,
          })),
          skipDuplicates: true,
        });
      }

      const now = new Date();

      await tx.attendanceSession.update({
        where: { id: session.id },
        data: {
          status: 'LOCKED',
          lockedAt: now,
          lockedById: actorId,
          finalizedAt: now,
          finalizedById: actorId,
          note: dto.note?.trim()?.slice(0, 200) || null,
        },
        select: { id: true },
      });

      return { ok: true, autoAbsent: missing.length };
    });
  }

  // ===== 5) MONTHLY GRID =====
  async monthlyGrid(q: AttendanceMonthlyDto) {
    const group = await this.prisma.group.findFirst({
      where: { id: q.groupId, deletedAt: null, isActive: true },
      select: { id: true },
    });
    if (!group) throw new NotFoundException('Guruh topilmadi');

    const { from, to } = parseMonthOrThrow(q.month);

    const sessions = await this.prisma.attendanceSession.findMany({
      where: { groupId: q.groupId, date: { gte: from, lt: to } },
      orderBy: { date: 'asc' },
      select: {
        id: true,
        date: true,
        startMin: true,
        endMin: true,
        openAt: true,
        closeAt: true,
        status: true,
        lockedAt: true,
        finalizedAt: true,
      },
    });

    const enrolls = await this.prisma.enrollment.findMany({
      where: {
        groupId: q.groupId,
        status: EnrollmentStatus.ACTIVE,
        deletedAt: null,
      },
      select: {
        student: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { startedAt: 'asc' },
    });

    const sessionIds = sessions.map((s) => s.id);
    const attendance = sessionIds.length
      ? await this.prisma.attendance.findMany({
          where: { sessionId: { in: sessionIds } },
          select: {
            sessionId: true,
            studentId: true,
            status: true,
            comment: true,
          },
        })
      : [];

    const map: Record<
      string,
      Record<string, { status: string; comment: string | null }>
    > = {};

    for (const a of attendance) {
      (map[a.sessionId] ??= {})[a.studentId] = {
        status: a.status,
        comment: a.comment ?? null,
      };
    }

    return {
      sessions,
      students: enrolls.map((e) => e.student),
      attendanceMap: map,
    };
  }
}
