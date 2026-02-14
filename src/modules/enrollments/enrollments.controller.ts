import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { QueryEnrollmentDto } from './dto/query-enrollment.dto';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';
import { AccessTokenGuard } from 'src/auth/guards/accessToken.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { Role as PrismaRole } from '@prisma/client';

@Controller('enrollments')
@UseGuards(AccessTokenGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly service: EnrollmentsService) {}

  @Roles(PrismaRole.ADMIN, PrismaRole.MANAGER)
  @Post()
  create(@Body() dto: CreateEnrollmentDto, @Req() req: any) {
    const actorId = req.user?.id ?? req.user?.sub;
    return this.service.create(actorId, dto);
  }

  @Roles(PrismaRole.ADMIN, PrismaRole.MANAGER)
  @Get()
  findAll(@Query() query: QueryEnrollmentDto) {
    return this.service.findAll(query);
  }

  @Roles(PrismaRole.ADMIN, PrismaRole.MANAGER)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Roles(PrismaRole.ADMIN, PrismaRole.MANAGER)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEnrollmentStatusDto,
    @Req() req: any,
  ) {
    const actorId = req.user?.id ?? req.user?.sub;
    return this.service.updateStatus(actorId, id, dto.status);
  }

  @Roles(PrismaRole.ADMIN)
  @Delete(':id')
  softDelete(@Param('id') id: string, @Req() req: any) {
    const actorId = req.user?.id ?? req.user?.sub;
    return this.service.softDelete(actorId, id, 'manual delete');
  }
}
