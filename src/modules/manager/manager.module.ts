import { Module } from '@nestjs/common';
import { ManagerActiveGuard } from './guards/manager-active.guard';
import { ManagerCommandController } from './controller/manager.command.controller';
import { ManagerQueryController } from './controller/manager.query.controller';
import { ManagerQueryService } from './service/manager.query.service';
import { ManagerLifecycleService } from './service/manager.lifecycle.service';

@Module({
  controllers: [ManagerCommandController, ManagerQueryController],
  providers: [ManagerLifecycleService, ManagerQueryService, ManagerActiveGuard],
  exports: [ManagerActiveGuard],
})
export class ManagersModule {}
