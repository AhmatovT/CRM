import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TeacherAssignmentService } from './teacher-assignment.service';
import { AssignTeacherDto } from './dto/assign-teacher.dto';
import { AccessTokenGuard } from 'src/auth/guards/accessToken.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { Role } from '@prisma/client';

@Controller('teacher-assignments')
@UseGuards(AccessTokenGuard, RolesGuard)
export class TeacherAssignmentController {
  constructor(private readonly service: TeacherAssignmentService) {}

  // =========================
  // ASSIGN
  // =========================

  @Roles(Role.ADMIN, Role.MANAGER)
  @Post('assign')
  assign(@Body() dto: AssignTeacherDto) {
    return this.service.assign(dto);
  }

  // =========================
  // REASSIGN
  // =========================

  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch(':id/restore')
  restore(@Param('id') id: string) {
    return this.service.restore(id);
  }

  // =========================
  // REMOVE
  // =========================

  @Roles(Role.ADMIN, Role.MANAGER)
  @Patch(':id/remove')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  // =========================
  // FIND BY GROUP
  // =========================

  @Roles(Role.ADMIN, Role.MANAGER)
  @Get('group/:groupId')
  findByGroup(@Param('groupId') groupId: string) {
    return this.service.findByGroup(groupId);
  }

  // =========================
  // GET ALL TEACHERS + GROUPS
  // =========================

  @Roles(Role.ADMIN, Role.MANAGER)
  @Get()
  getAll() {
    return this.service.getAll();
  }
}
