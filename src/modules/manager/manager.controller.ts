import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Patch,
  Req,
} from '@nestjs/common';
import { CreateManagerDto } from './dto/create-manager.dto';
import { UpdateManagerDto } from './dto/update-manager.dto';
import { ManagerService } from './manager.service.ts';

@Controller('managers')
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  // ===============================
  // CREATE MANAGER
  // ===============================
  @Post()
  create(@Body() dto: CreateManagerDto) {
    return this.managerService.create(dto);
  }

  // ===============================
  // GET ALL MANAGERS
  // ===============================
  @Get()
  getAll() {
    return this.managerService.getAll();
  }

  // ===============================
  // GET MANAGER BY ID
  // ===============================
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.managerService.getById(id);
  }

  // ===============================
  // UPDATE MANAGER
  // ===============================
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateManagerDto) {
    return this.managerService.update(id, dto);
  }

  // ===============================
  // SOFT DELETE MANAGER
  // ===============================
  @Delete(':id')
  softDelete(@Param('id') id: string, @Req() req: any) {
    // agar adminId kerak bo‘lsa
    return this.managerService.softDelete(id, req?.user?.id);
  }
}
