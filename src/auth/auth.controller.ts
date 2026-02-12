import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { appConfig } from 'src/config/app.config';
import type { ConfigType } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import type { Response, Request } from 'express';
import { AccessTokenGuard } from './guards/accessToken.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly service: AuthService,
    @Inject(appConfig.KEY) private readonly cfg: ConfigType<typeof appConfig>,
  ) {}

  private cookieName() {
    return this.cfg.cookie.name;
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      secure: this.cfg.cookie.secure,
      sameSite: this.cfg.cookie.sameSite,
      path: '/api/auth',
    } as const;
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const req = await this.service.login(dto.phone, dto.password);
    res.cookie(this.cookieName(), req.refreshToken, this.cookieOptions());
    return {
      accessToken: req.accessToken,
      mustChangePassword: req.mustChangePassword,
      role: req.role,
      id: req.userId,
    };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const raw = req.cookies?.[this.cookieName()];
    if (!raw) throw new UnauthorizedException('No refresh token');
    const r = await this.service.refresh(raw);
    res.cookie(this.cookieName(), r.refreshToken, this.cookieOptions());
    return {
      accessToken: r.accessToken,
      mustChangePassword: r.mustChangePassword,
      role: r.role,
      id: r.userId,
    };
  }
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = req.cookies?.[this.cookieName()];
    await this.service.logout(raw);
    res.clearCookie(this.cookieName(), this.cookieOptions());
    return { ok: true };
  }

  @UseGuards(AccessTokenGuard)
  @Get('me')
  me(@Req() req: any) {
    return req.user;
  }
}
