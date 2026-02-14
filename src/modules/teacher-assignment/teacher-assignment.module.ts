import { Module } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { TeacherAssignmentController } from './teacher-assignment.controller';
import { TeacherAssignmentService } from './teacher-assignment.service';

@Module({
  controllers: [TeacherAssignmentController],
  providers: [TeacherAssignmentService, PrismaService],
})
export class TeacherAssignmentModule {}
