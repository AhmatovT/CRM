import { Role } from '@prisma/client';

export interface JwtUser {
  id: string;
  role: Role;
  mustChangePassword: boolean;
}
