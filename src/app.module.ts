import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { envValidationSchema } from './config/env.validation';
import { appConfig } from './config/app.config';
import { HealthModule } from './modules/health/healt.module';
import { ManagersModule } from './modules/manager/manager.module';
import { PrismaModule } from 'prisma/prisma.module';
import { TeacherModule } from './modules/teacher/teachers.module';
import { StudentsModule } from './modules/students/students.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      load: [appConfig],
    }),
    PrismaModule,
    HealthModule,
    ManagersModule,
    TeacherModule,
    StudentsModule,
  ],
  providers: [],
  controllers: [],
})
export class AppModule {}
