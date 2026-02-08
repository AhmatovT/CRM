import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
import { appConfig } from './config/app.config';
import { AuthModule } from './auth/auth.module';

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
  ],
  providers: [],
  controllers: [],
})
export class AppModule {}
