export class ManagerResponseDto {
  id: string; // managerProfile.id
  userId: string;

  firstName: string;
  lastName: string;
  phone?: string;

  note?: string;

  createdAt: Date;
}
