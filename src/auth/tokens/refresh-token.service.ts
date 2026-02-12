import {
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'prisma/prisma.service';
import { appConfig } from 'src/config/app.config';
import { TokenHashUtil } from '../utils/token-hash.util';
import { RefreshTokenPayload } from '../types/auth.type';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    @Inject(appConfig.KEY) private readonly cfg: ConfigType<typeof appConfig>,
  ) {}

  private expiresAt(): Date {
    const d = new Date();
    d.setDate(d.getDate() + this.cfg.jwt.refreshTtlDays);
    return d;
  }
  private hash(raw: string) {
    return TokenHashUtil.sha256(raw, this.cfg.refreshHashPepper);
  }

  async sign(userId: string) {
    const token = await this.jwt.signAsync<RefreshTokenPayload>(
      { sub: userId },
      {
        secret: this.cfg.jwt.refreshSecret,
        expiresIn: `${this.cfg.jwt.refreshTtlDays}d`,
      },
    );
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hash(token),
        expiresAt: this.expiresAt(),
      },
    });
    return token;
  }

  private async verifyJwtOrThrow(raw: string): Promise<RefreshTokenPayload> {
    try {
      return await this.jwt.verifyAsync<RefreshTokenPayload>(raw, {
        secret: this.cfg.jwt.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async revokeAllForUser(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async rotate(raw: string) {
    if (!raw) throw new UnauthorizedException('Missing refresh token');
    const payload = await this.verifyJwtOrThrow(raw);
    const userId = payload.sub;

    const tokenHash = this.hash(raw);
    const dbToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (!dbToken || dbToken.revokedAt) {
      await this.revokeAllForUser(userId);
      throw new UnauthorizedException('Refresh token reuse detected');
    }
    if (dbToken.expiresAt.getTime() < Date.now()) {
      await this.revokeAllForUser(userId);
      throw new UnauthorizedException('Refresh token expired');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      await this.revokeAllForUser(userId);
      throw new UnauthorizedException('User not found');
    }
    if (user.status !== 'ACTIVE') {
      await this.revokeAllForUser(userId);
      throw new ForbiddenException('User is not active');
    }

    const newRefreshToken = await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.update({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      });

      const issued = await this.jwt.signAsync<RefreshTokenPayload>(
        { sub: userId },
        {
          secret: this.cfg.jwt.refreshSecret,
          expiresIn: `${this.cfg.jwt.refreshTtlDays}d`,
        },
      );
      await tx.refreshToken.create({
        data: {
          userId,
          tokenHash: this.hash(issued),
          expiresAt: this.expiresAt(),
        },
      });
      return issued;
    });

    return { user, refreshToken: newRefreshToken };
  }

  async revoke(raw?: string) {
    if (!raw) return;

    const tokenHash = this.hash(raw);
    const dbToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });
    if (!dbToken || dbToken.revokedAt) return;
    await this.prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }
}
