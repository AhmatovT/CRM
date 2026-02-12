import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupsService } from './group.service';
import { GroupQueryDto } from './dto/group-query.dto';
import { AccessTokenGuard } from 'src/auth/guards/accessToken.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Role } from '@prisma/client'; // <-- qo'shing
import { Roles } from 'src/auth/decorators/roles.decorators';

@Controller('groups')
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles(Role.ADMIN , Role.MANAGER) // <-- BARCHA so'rovlar uchun bitta role
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Post()
  create(@Body() dto: CreateGroupDto) {
    return this.groupsService.create(dto);
  }

  @Get()
  findAll(@Query() query: GroupQueryDto) {
    return this.groupsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.groupsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateGroupDto) {
    return this.groupsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.groupsService.softDelete(id, 'system', 'manual delete');
  }
}
