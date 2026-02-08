import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { CreateManagerDto } from '../dto/create-manager.dto';
import { ManagerLifecycleService } from '../service/manager.lifecycle.service';
// import { Roles } from '@/common/decorators/roles.decorator';

// @Roles('ADMIN')
@Controller('managers')
export class ManagerCommandController {
  constructor(private readonly lifecycle: ManagerLifecycleService) {}

  @Post()
  create(@Body() dto: CreateManagerDto) {
    return this.lifecycle.create(dto);
  }

  @Delete(':id')
  deactivate(@Param('id') id: string) {
    // deletedById odatda req.user.id dan olinadi
    return this.lifecycle.deactivate(id, 'SYSTEM');
  }
}
