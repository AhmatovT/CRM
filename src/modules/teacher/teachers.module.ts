import { Module } from '@nestjs/common';
import { TeacherController } from './teacher.controller';
import { PrismaService } from 'prisma/prisma.service';
import { TeacherService } from './teacher.service.ts ';

@Module({
  controllers: [TeacherController],
  providers: [TeacherService, PrismaService],
})
export class TeacherModule {}
