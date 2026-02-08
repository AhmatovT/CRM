import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { TeacherQueryService } from '../services/teacher.query.service';
import { CreateTeacherDto } from '../dto/create-teacher.dto';
import { TeacherResponseDto } from '../dto/teacher-response.dto';


@Controller('teachers')
export class TeacherController {
  constructor(
    private readonly teacherQueryService: TeacherQueryService,
  ) {}

  // ===============================
  // CREATE TEACHER
  // POST /teachers
  // ===============================
  @Post()
  async create(
    @Body() dto: CreateTeacherDto,
  ) {
    return this.teacherQueryService.createTeacher(dto);
  }

  // ===============================
  // GET ALL TEACHERS
  // GET /teachers
  // ===============================
  @Get()
  async getAll(): Promise<TeacherResponseDto[]> {
    return this.teacherQueryService.getAll();
  }

  // ===============================
  // GET TEACHER BY ID
  // GET /teachers/:id
  // ===============================
  @Get(':id')
  async getById(
    @Param('id') id: string,
  ): Promise<TeacherResponseDto> {
    return this.teacherQueryService.getById(id);
  }

  // ===============================
  // SOFT DELETE TEACHER
  // DELETE /teachers/:id
  // ===============================
@Delete(':userId')
async softDelete(@Param('userId') userId: string) {
  return this.teacherQueryService.softDeleteTeacherByUserId(userId);
}

}
