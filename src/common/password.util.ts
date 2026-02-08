import * as argon2 from 'argon2';

export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id, // 🔐 ENG TAVSIYA QILINADIGANI
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3, // iteration
    parallelism: 1,
  });
}

export async function verifyPassword(
  hash: string,
  plain: string,
): Promise<boolean> {
  return argon2.verify(hash, plain);
}
