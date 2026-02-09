export class StudentResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;

  address: string;
  idCard: string;
  photoUrl: string;

  isActive: boolean;
  createdAt: Date;
}
