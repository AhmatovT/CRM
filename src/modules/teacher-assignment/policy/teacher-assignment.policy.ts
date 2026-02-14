import { BadRequestException } from '@nestjs/common';

export class TeacherAssignmentPolicy {
  static ensureNoActiveTeacher(active: any) {
    if (active) {
      throw new BadRequestException('Group already has an active teacher');
    }
  }

  static ensureActiveExists(active: any) {
    if (!active) {
      throw new BadRequestException('No active teacher found for this group');
    }
  }

  static ensureDifferentTeacher(activeTeacherId: string, newTeacherId: string) {
    if (activeTeacherId === newTeacherId) {
      throw new BadRequestException(
        'Teacher is already assigned to this group',
      );
    }
  }
}
