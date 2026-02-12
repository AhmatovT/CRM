import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Patch,
  Req,
  Put,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';
import { AccessTokenGuard } from 'src/auth/guards/accessToken.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { Role } from '@prisma/client';
import { ManagerService } from './manager.service.ts';

@Controller('managers')
@UseGuards(AccessTokenGuard, RolesGuard)
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  // ===============================
  // CREATE MANAGER (ADMIN ONLY)
  // ===============================
  @Post()
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateManagerDto) {
    return this.managerService.create(dto);
  }

  // ===============================
  // GET ALL (ADMIN + MANAGER)
  // ===============================
  @Get()
  getAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.managerService.getAll(Number(page), Number(limit));
  }

  // ===============================
  // GET BY ID (ADMIN + MANAGER)
  // ===============================
  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  getById(@Param('id') id: string) {
    return this.managerService.getById(id);
  }

  // ===============================
  // UPDATE (ADMIN ONLY)
  // ===============================
  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateManagerDto) {
    return this.managerService.update(id, dto);
  }

  // ===============================
  // SOFT DELETE (ADMIN ONLY)
  // ===============================
  @Delete(':id')
  softDelete(@Param('id') id: string, @Req() req: any) {
    const adminId = req.user?.id ?? req.user?.sub; // token payloadga qarab
    return this.managerService.softDelete(id, adminId);
  }

  // ===============================
  // RESTORE (ADMIN ONLY)
  // ===============================
  @Put(':id/restore')
  @Roles(Role.ADMIN)
  restore(@Param('id') id: string) {
    return this.managerService.restore(id);
  }

  // ===============================
  // DELETE HISTORY (ADMIN ONLY)
  // ===============================
  @Get('deleted/history')
  @Roles(Role.ADMIN)
  getDeleteHistory() {
    return this.managerService.getDeleteHistory();
  }
}
