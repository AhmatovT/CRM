import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { envValidationSchema } from './config/env.validation';
import { appConfig } from './config/app.config';

import { PrismaModule } from 'prisma/prisma.module';
import { RoomsModule } from './modules/rooms/rooms.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      load: [appConfig],
    }),

    // ✅ DB l ayer
    PrismaModule,

    // ✅ Feature module
    RoomsModule,
  ],
})
export class AppModule {}
