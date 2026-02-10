import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { AccessTokenService } from './tokens/access-token.service';
import { RefreshTokenService } from './tokens/refresh-token.service';
import { PasswordUtil } from './utils/password.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessToken: AccessTokenService,
    private readonly refreshToken: RefreshTokenService,
  ) {}

  async login(phone: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException('User is not active');
    }
    if (!user.passwordHash) throw new ForbiddenException('Password is not set');

    const ok = await PasswordUtil.verify(user.passwordHash, password);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    const accessToken = await this.accessToken.sign(user.id, user.role);
    const refreshToken = await this.refreshToken.sign(user.id);

    return {
      accessToken,
      refreshToken,
      mustChangePassword: user.mustChangePassword,
      role: user.role,
      userId: user.id,
    };
  }

  async refresh(rawRefresh: string) {
    const { user, refreshToken } = await this.refreshToken.rotate(rawRefresh);
    const accessToken = await this.accessToken.sign(user.id, user.role);

    return {
      accessToken,
      refreshToken,
      mustChangePassword: user.mustChangePassword,
      role: user.role,
      userId: user.id,
    };
  }

  async logout(rawRefresh?: string) {
    await this.refreshToken.revoke(rawRefresh);
    return { ok: true };
  }
}
