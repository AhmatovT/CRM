import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { TeacherService } from './teacher.service.ts ';

@Controller('teachers')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  // ===============================
  // CREATE TEACHER
  // ===============================

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTeacherDto) {
    return this.teacherService.create(dto);
  }

  // ===============================
  // GET ALL
  // ===============================

  @Get()
  findAll() {
    return this.teacherService.findAll();
  }

  // ===============================
  // GET ONE
  // ===============================

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.teacherService.findById(id);
  }

  // ===============================
  // UPDATE
  // ===============================

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTeacherDto,
  ) {
    return this.teacherService.update(id, dto);
  }

  // ===============================
  // SOFT DELETE
  // ===============================

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.teacherService.softDelete(id);
  }
}
