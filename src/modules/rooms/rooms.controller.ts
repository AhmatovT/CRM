import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { AccessTokenGuard } from 'src/auth/guards/accessToken.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';
import { Role } from '@prisma/client';

@UseGuards(AccessTokenGuard, RolesGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.MANAGER)
  create(@Body() dto: CreateRoomDto) {
    return this.roomsService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.MANAGER)
  list() {
    return this.roomsService.list();
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  getOne(@Param('id') id: string) {
    return this.roomsService.getOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateRoomDto) {
    return this.roomsService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.MANAGER)
  softDelete(@Param('id') id: string) {
    return this.roomsService.softDelete(id);
  }
}
