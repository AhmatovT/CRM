import { createHash } from 'crypto';

export const TokenHashUtil = {
  sha256(raw: string, pepper: string): string {
    return createHash('sha256').update(`${raw}.${pepper}`).digest('hex');
  },
};
