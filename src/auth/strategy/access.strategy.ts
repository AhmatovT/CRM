import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'prisma/prisma.service';
import { appConfig } from 'src/config/app.config';
import { AccessTokenPayload } from '../types/auth.type';

@Injectable()
export class AccessJwtStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(
    @Inject(appConfig.KEY) cfg: ConfigType<typeof appConfig>,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: cfg.jwt.accessSecret,
    });
  }

  async validate(payload: AccessTokenPayload) {
    if (!payload?.sub) {
      throw new UnauthorizedException('Invalid access token paylaod');
    }
    if (payload.ver === undefined || payload.ver === null) {
      throw new UnauthorizedException('Missing token version');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        role: true,
        status: true,
        tokenVersion: true,
        mustChangePassword: true,
      },
    });
    if (!user) throw new UnauthorizedException('User not found');
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('User is not active');
    }
    if (user.tokenVersion !== payload.ver) {
      {
        throw new UnauthorizedException('Access token revoked');
      }
    }
    return {
      userId: user.id,
      role: payload.role,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
