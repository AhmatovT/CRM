import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AssignTeacherDto } from './dto/assign-teacher.dto';
import { TeacherAssignmentPolicy } from './policy/teacher-assignment.policy';
import { PrismaService } from 'prisma/prisma.service';

@Injectable()
export class TeacherAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  // ================= PRIVATE HELPERS =================

  private async ensureGroupExists(
    tx: Prisma.TransactionClient,
    groupId: string,
  ) {
    const group = await tx.group.findUnique({
      where: { id: groupId },
    });

    if (!group) throw new NotFoundException('Group not found');
    return group;
  }

  private async ensureTeacherExists(
    tx: Prisma.TransactionClient,
    teacherId: string,
  ) {
    const teacher = await tx.teacherProfile.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) throw new NotFoundException('Teacher not found');
    return teacher;
  }

  private async getActiveByGroup(
    tx: Prisma.TransactionClient,
    groupId: string,
  ) {
    return tx.teacherAssignment.findFirst({
      where: {
        groupId,
        isActive: true,
      },
    });
  }

  private async getActiveByTeacher(
    tx: Prisma.TransactionClient,
    teacherId: string,
  ) {
    return tx.teacherAssignment.findFirst({
      where: {
        teacherId,
        isActive: true,
      },
    });
  }

  // ================= ASSIGN =================

  async assign(dto: AssignTeacherDto) {
    return this.prisma.$transaction(async (tx) => {
      await this.ensureGroupExists(tx, dto.groupId);
      await this.ensureTeacherExists(tx, dto.teacherId);

      const activeGroup = await this.getActiveByGroup(tx, dto.groupId);
      TeacherAssignmentPolicy.ensureNoActiveTeacher(activeGroup);

      const teacherActive = await this.getActiveByTeacher(tx, dto.teacherId);

      if (teacherActive) {
        throw new BadRequestException(
          'Teacher already assigned to another group',
        );
      }

      return tx.teacherAssignment.create({
        data: {
          teacherId: dto.teacherId,
          groupId: dto.groupId,
        },
      });
    });
  }

  // ================= REMOVE (SOFT DEACTIVATE) =================

  async remove(assignmentId: string) {
    const assignment = await this.prisma.teacherAssignment.findUnique({
      where: { id: assignmentId },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    if (!assignment.isActive) {
      throw new BadRequestException('Assignment already inactive');
    }

    return this.prisma.teacherAssignment.update({
      where: { id: assignmentId },
      data: {
        isActive: false,
        endedAt: new Date(),
      },
    });
  }

  // ================= RESTORE =================

  async restore(assignmentId: string) {
    return this.prisma.$transaction(async (tx) => {
      const assignment = await tx.teacherAssignment.findUnique({
        where: { id: assignmentId },
      });

      if (!assignment) {
        throw new NotFoundException('Assignment not found');
      }

      if (assignment.isActive) {
        throw new BadRequestException('Assignment is already active');
      }

      // 🔥 Group ichida boshqa active bo‘lmasligi kerak
      const activeGroup = await this.getActiveByGroup(tx, assignment.groupId);

      TeacherAssignmentPolicy.ensureNoActiveTeacher(activeGroup);

      // 🔥 Teacher boshqa groupda active bo‘lmasligi kerak
      const teacherActive = await this.getActiveByTeacher(
        tx,
        assignment.teacherId,
      );

      if (teacherActive) {
        throw new BadRequestException(
          'Teacher already assigned to another group',
        );
      }

      return tx.teacherAssignment.update({
        where: { id: assignmentId },
        data: {
          isActive: true,
          endedAt: null,
        },
      });
    });
  }

  // ================= FIND BY GROUP =================

  async findByGroup(groupId: string) {
    return this.prisma.teacherAssignment.findMany({
      where: { groupId },
      include: {
        teacher: true,
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });
  }

  // ================= GET ALL =================

  async getAll() {
    return this.prisma.teacherProfile.findMany({
      include: {
        assignments: {
          include: {
            group: true,
          },
          orderBy: {
            assignedAt: 'desc',
          },
        },
      },
    });
  }
}
