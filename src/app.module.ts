import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
import { appConfig } from './config/app.config';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from 'prisma/prisma.module';
import { HealthModule } from './modules/health/healt.module';
import { ManagersModule } from './modules/manager/manager.module';
import { TeacherModule } from './modules/teacher/teachers.module';
import { StudentsModule } from './modules/students/students.module';

import { RoomsModule } from './modules/rooms/rooms.module';
import { GroupsModule } from './modules/group/group.module';
import { TeacherAssignmentModule } from './modules/teacher-assignment/teacher-assignment.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      load: [appConfig],
    }),
    AuthModule,
    PrismaModule,
    HealthModule,
    ManagersModule,
    TeacherModule,
    StudentsModule,

    // ✅ DB l ayer
    PrismaModule,

    // ✅ Feature module
    RoomsModule,
    GroupsModule,
    TeacherAssignmentModule,
    PrismaModule,
  ],
})
export class AppModule {}
