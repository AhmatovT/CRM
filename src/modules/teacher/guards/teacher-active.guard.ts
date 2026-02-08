import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "prisma/prisma.service";

@Injectable()
export class TeacherActiveGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;

    if (user.role !== 'TEACHER') return true;

    const teacher = await this.prisma.teacherProfile.findUnique({
      where: { userId: user.id },
    });

    if (!teacher || teacher.deletedAt !== null) {
      throw new ForbiddenException('Teacher is deactivated');
    }

    return true;
  }
}
