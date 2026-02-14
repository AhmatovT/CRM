import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import {
  OpenAttendanceSessionDto,
  FinalizeAttendanceDto,
} from './dto/session.dto';
import { MarkAttendanceDto, BulkAttendanceDto } from './dto/attendance.dto';
import { AttendanceMonthlyDto } from './dto/query.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly service: AttendanceService) {}

  // // ✅ 1) Session open (teacher)
  // @Post('sessions/open')
  // openSession(
  //   @Headers('x-actor-id') actorId: string,
  //   @Body() dto: OpenAttendanceSessionDto,
  // ) {
  //   return this.service.openSession(actorId, dto);
  // }

  // ✅ 2) Mark 1 student
  @Post('mark')
  mark(@Headers('x-actor-id') actorId: string, @Body() dto: MarkAttendanceDto) {
    return this.service.mark(actorId, dto);
  }

  // ✅ 3) Bulk mark
  @Post('bulk')
  bulk(@Headers('x-actor-id') actorId: string, @Body() dto: BulkAttendanceDto) {
    return this.service.bulkMark(actorId, dto);
  }

  // ✅ 4) Finalize + lock
  @Post('finalize')
  finalize(
    @Headers('x-actor-id') actorId: string,
    @Body() dto: FinalizeAttendanceDto,
  ) {
    return this.service.finalize(actorId, dto);
  }

  // ✅ 5) Monthly grid
  @Get('monthly')
  monthly(@Query() q: AttendanceMonthlyDto) {
    return this.service.monthlyGrid(q);
  }
}
