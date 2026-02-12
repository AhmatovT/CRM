import * as argon2 from 'argon2';

export const PasswordUtil = {
  async hash(raw: string) {
    return argon2.hash(raw, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
  },
  async verify(hash: string, raw: string) {
    return argon2.verify(hash, raw);
  },
};
