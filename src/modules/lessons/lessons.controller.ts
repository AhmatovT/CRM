import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Controller('lessons')
@UseGuards() // 🔥 Barcha endpointlar login talab qiladi
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  // ✅ LESSON CREATE
  // Teacher yangi lesson yaratadi
  @Post()
  create(@Body() dto: CreateLessonDto, @Req() req) {
    // req.user.id → login bo‘lgan teacher
    return this.lessonsService.create(dto, req.user.id);
  }

  // ✅ LESSON UPDATE
  // Teacher lesson ma’lumotlarini o‘zgartiradi
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLessonDto,
    @Req() req,
  ) {
    return this.lessonsService.update(id, dto, req.user.id);
  }

  // ✅ MARK AS HELD
  // Teacher darsni o‘tilgan deb belgilaydi
  @Patch(':id/held')
  markAsHeld(@Param('id') id: string, @Req() req) {
    return this.lessonsService.markAsHeld(id, req.user.id);
  }

  // ✅ FIND ALL LESSONS
  // Teacher o‘z lessonlarini ko‘radi
  @Get()
  findAll(@Req() req) {
    return this.lessonsService.findAll(req.user.id);
  }

  // ✅ FIND ONE LESSON
  // Bitta lesson detail
  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.lessonsService.findOne(id, req.user.id);
  }
}