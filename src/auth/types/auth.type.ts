import { Role } from '@prisma/client';

export type AccessTokenPayload = {
  sub: string;
  role: Role;
  ver: number;
};

export type RefreshTokenPayload = {
  sub: string;
};
