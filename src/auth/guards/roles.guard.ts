import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorators';
import { Role } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required =
      this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
        ctx.getHandler(),
        ctx.getClass(),
      ]) ?? [];

    if (required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest();
    if (!req.user) throw new UnauthorizedException('Unauthenticated');

    const role = req.user.role as Role | undefined;
    if (!role) throw new ForbiddenException('No role');

    if (!required.includes(role)) throw new ForbiddenException('Forbidden');
    return true;
  }
}
