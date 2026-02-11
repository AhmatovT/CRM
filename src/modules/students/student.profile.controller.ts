import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { StudentProfileService } from './student.profile.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Controller('students')
export class StudentProfileController {
  constructor(private readonly service: StudentProfileService) {}

  @Post()
  create(@Body() dto: CreateStudentDto) {
    return this.service.create(dto);
  }
  @Get()
  getAll() {
    return this.service.getAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: any) {
    return this.service.softDelete(id, req.user.id);
  }
}
