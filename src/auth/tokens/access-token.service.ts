import { JwtService } from '@nestjs/jwt';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AccessTokenPayload } from '../types/auth.type';
import { Role } from '@prisma/client';

@Injectable()
export class AccessTokenService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async sign(userId: string, role: Role) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tokenVersion: true },
    });
    const payload: AccessTokenPayload = {
      sub: userId,
      role,
      ver: user?.tokenVersion ?? 0,
    };
    return this.jwt.signAsync(payload);
  }
}
