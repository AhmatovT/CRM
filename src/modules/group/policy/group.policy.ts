import { BadRequestException } from '@nestjs/common';

export class GroupPolicy {
  static ensureEndAfterStart(start: Date, end: Date) {
    if (end <= start) {
      throw new BadRequestException('End time must be after start time');
    }
  }

  static ensureDurationIsTwoHours(start: Date, end: Date) {
    const diff = end.getTime() - start.getTime();
    const twoHours = 2 * 60 * 60 * 1000;

    if (diff !== twoHours) {
      throw new BadRequestException('Lesson duration must be exactly 2 hours');
    }
  }
}
