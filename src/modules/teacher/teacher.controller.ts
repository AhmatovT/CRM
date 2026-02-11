import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  HttpCode,
  HttpStatus,
  Req,
  Put,
  UseGuards,
} from '@nestjs/common';

import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { TeacherService } from './teacher.service.ts ';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { Role } from '@prisma/client';
import { AccessTokenGuard } from 'src/auth/guards/accessToken.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('teachers')
@UseGuards(AccessTokenGuard, RolesGuard)
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  // ===============================
  // CREATE (ADMIN ONLY)
  // ===============================
  @Post()
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTeacherDto) {
    return this.teacherService.create(dto);
  }

  // ===============================
  // GET ALL (ADMIN + MANAGER)
  // ===============================
  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  findAll() {
    return this.teacherService.findAll();
  }

  // ===============================
  // GET ONE (ADMIN + MANAGER)
  // ===============================
  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  findOne(@Param('id') id: string) {
    return this.teacherService.findById(id);
  }

  // ===============================
  // UPDATE (ADMIN ONLY)
  // ===============================
  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateTeacherDto) {
    return this.teacherService.update(id, dto);
  }

  // ===============================
  // SOFT DELETE (ADMIN ONLY)
  // ===============================
  @Delete(':id')
  @Roles(Role.ADMIN)
  delete(@Param('id') id: string, @Req() req: any) {
    return this.teacherService.softDelete(id, req.user.id);
  }

  // ===============================
  // DELETE HISTORY (ADMIN ONLY)
  // ===============================
  @Get('deleted/history')
  @Roles(Role.ADMIN)
  getDeleteHistory() {
    return this.teacherService.getDeleteHistory();
  }

  // ===============================
  // RESTORE (ADMIN ONLY)
  // ===============================
  @Put(':id/restore')
  @Roles(Role.ADMIN)
  restore(@Param('id') id: string) {
    return this.teacherService.restore(id);
  }
}
