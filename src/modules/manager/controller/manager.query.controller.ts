import { Controller, Get, Param } from '@nestjs/common';
import { ManagerQueryService } from '../service/manager.query.service';

// @Roles('ADMIN')
@Controller('managers')
export class ManagerQueryController {
  constructor(private readonly query: ManagerQueryService) {}

  @Get()
  getAll() {
    return this.query.getAll();
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.query.getById(id);
  }
}
