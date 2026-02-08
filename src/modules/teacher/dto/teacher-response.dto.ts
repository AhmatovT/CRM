export class TeacherResponseDto {
  id: string;

  firstName: string;
  lastName: string;

  phone?: string;        // ✅ optional
  lessonPrice?: number; // ✅ optional
  percent?: number;     // ✅ optional
monthlySalary: number | null;
  createdAt: Date;
}
