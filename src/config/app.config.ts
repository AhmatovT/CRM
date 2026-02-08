import { registerAs } from '@nestjs/config';
import type { StringValue } from 'ms';

export const appConfig = registerAs('app', () => ({
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    accessTtl: (process.env.JWT_ACCESS_TTL || '15m') as StringValue, // ✅
    refreshTtlDays: Number(process.env.JWT_REFRESH_TTL_DAYS || 30),
  },
  refreshHashPepper: process.env.REFRESH_HASH_PEPPER!,
  cookie: {
    name: process.env.REFRESH_COOKIE_NAME || 'refresh_token',
    secure: (process.env.COOKIE_SECURE || 'false') === 'true',
    sameSite: (process.env.COOKIE_SAMESITE || 'lax') as
      | 'lax'
      | 'strict'
      | 'none',
  },

  inviteTokenPepper: process.env.INVITE_TOKEN_PEPPER!,

  throttle: {
    ttlSeconds: Number(process.env.THROTTLE_TTL_SECONDS || 60),
    limitDefault: Number(process.env.THROTTLE_LIMIT_DEFAULT || 120),
    limitLogin: Number(process.env.THROTTLE_LIMIT_LOGIN || 8),
    limitRefresh: Number(process.env.THROTTLE_LIMIT_REFRESH || 30),
  },
}));
