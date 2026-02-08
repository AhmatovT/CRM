import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
@Injectable()
export class ManagerActiveGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (user.role !== 'MANAGER') return true;

    const manager = await this.prisma.managerProfile.findUnique({
      where: { userId: user.id },
    });

    if (!manager || manager.deletedAt) {
      throw new ForbiddenException('Manager is deactivated');
    }

    return true;
  }
}
