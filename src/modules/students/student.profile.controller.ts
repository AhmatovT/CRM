import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { StudentProfileService } from './student.profile.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { AccessTokenGuard } from 'src/auth/guards/accessToken.guard';
import { Role } from '@prisma/client';

@Controller('students')
@UseGuards(AccessTokenGuard, RolesGuard)
export class StudentProfileController {
  constructor(private readonly service: StudentProfileService) {}
  @Roles(Role.ADMIN, Role.MANAGER)
  @Post()
  create(@Body() dto: CreateStudentDto) {
    return this.service.create(dto);
  }
  @Roles(Role.ADMIN, Role.MANAGER)
  @Get()
  getAll() {
    return this.service.getAll();
  }
  @Roles(Role.ADMIN, Role.MANAGER)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }
  @Roles(Role.ADMIN, Role.MANAGER)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStudentDto) {
    return this.service.update(id, dto);
  }
  @Roles(Role.ADMIN, Role.MANAGER)
  @Delete(':id')
  softDelete(@Param('id') id: string, @Req() req: any) {
    const adminId = req.user?.id ?? req.user?.sub;
    return this.service.softDelete(id, adminId);
  }
  @Roles(Role.ADMIN)
  @Get('deleted/history')
  getDeleteHistory() {
    return this.service.getDeleteHistory();
  }
  @Roles(Role.ADMIN, Role.MANAGER)
  @Put(':id/restore')
  restore(@Param('id') id: string) {
    return this.service.restore(id);
  }
}
