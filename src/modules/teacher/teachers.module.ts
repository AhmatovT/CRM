import { Module } from "@nestjs/common";
import { TeacherCommandController } from "./controllers/teacher.command.controller";
import { TeacherLifecycleService } from "./services/teacher.lifecycle.service";
import { TeacherAcademicService } from "./services/teacher.academic.service";
import { TeacherQueryService } from "./services/teacher.query.service";
import { TeacherActiveGuard } from "./guards/teacher-active.guard";
import { TeacherController } from "./controllers/teacher.query.controller";

@Module({
  controllers: [
    TeacherCommandController,
    TeacherController,
  ],
  providers: [
    TeacherLifecycleService,
    TeacherAcademicService,
    TeacherQueryService,
    TeacherActiveGuard,
  ],
})
export class TeachersModule {}
