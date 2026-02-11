import { JwtModule } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { appConfig } from '../config/app.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AccessTokenService } from './tokens/access-token.service';
import { RefreshTokenService } from './tokens/refresh-token.service';
import { PrismaService } from 'prisma/prisma.service';
import { AccessJwtStrategy } from './strategy/access.strategy';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [appConfig.KEY],
      useFactory: (cfg: ConfigType<typeof appConfig>) => ({
        secret: cfg.jwt.accessSecret,
        signOptions: { expiresIn: cfg.jwt.accessTtl },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    PrismaService,
    AuthService,
    AccessTokenService,
    RefreshTokenService,
    AccessJwtStrategy,
  ],
})
export class AuthModule {}
