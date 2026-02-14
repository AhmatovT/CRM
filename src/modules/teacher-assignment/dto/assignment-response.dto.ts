export class AssignmentResponseDto {
  id: string;
  teacherId: string;
  groupId: string;
  assignedAt: Date;
  endedAt?: Date;
  isActive: boolean;
}
