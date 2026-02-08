import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { envValidationSchema } from './config/env.validation';
import { appConfig } from './config/app.config';
import { HealthModule } from './modules/health/healt.module';
import { ManagersModule } from './modules/manager/manager.module';
import { PrismaModule } from 'prisma/prisma.module';

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
  ],
  providers: [],
  controllers: [],
})
export class AppModule {}
