import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GroupsService } from './group.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { AccessTokenGuard } from 'src/auth/guards/accessToken.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { Role } from '@prisma/client';
import { JwtUser } from 'src/auth/types/jwt-user.type';

@Controller('groups')
@UseGuards(AccessTokenGuard, RolesGuard)
export class GroupsController {
  constructor(private readonly service: GroupsService) {}

  // ================= CREATE =================
  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  create(@Body() dto: CreateGroupDto, @Req() req: { user: JwtUser }) {
    return this.service.create(dto, req.user.id);
  }

  // ================= LIST =================
  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  findAll() {
    return this.service.findAll();
  }

  // ================= HISTORY (MUHIM: ID DAN OLDIN) =================
  @Get(':id/history')
  @Roles(Role.ADMIN)
  getHistory(@Param('id') id: string) {
    return this.service.getHistory(id);
  }

  // ================= RESTORE =================
  @Patch(':id/restore')
  @Roles(Role.ADMIN)
  restore(@Param('id') id: string, @Req() req: { user: JwtUser }) {
    return this.service.restore(id, req.user.id);
  }

  // ================= UPDATE =================
  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateGroupDto,
    @Req() req: { user: JwtUser },
  ) {
    return this.service.update(id, dto, req.user.id);
  }

  // ================= SOFT DELETE =================
  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  softDelete(@Param('id') id: string, @Req() req: { user: JwtUser }) {
    return this.service.softDelete(id, req.user.id, 'Deleted by user');
  }

  // ================= GET ONE (ENG OXIRIDA) =================
  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
