import request, { Response } from 'supertest';
import { INestApplication } from '@nestjs/common';

export async function typedPost<T>(
  app: INestApplication,
  url: string,
  body?: any,
  expectedStatus = 201,
): Promise<T> {
  const res: Response = await request(app.getHttpServer())
    .post(url)
    .send(body)
    .expect(expectedStatus);

  return res.body as T;
}

export async function typedPatch<T>(
  app: INestApplication,
  url: string,
  body?: any,
  expectedStatus = 200,
): Promise<T> {
  const res: Response = await request(app.getHttpServer())
    .patch(url)
    .send(body)
    .expect(expectedStatus);

  return res.body as T;
}

export async function typedGet<T>(
  app: INestApplication,
  url: string,
  expectedStatus = 200,
): Promise<T> {
  const res: Response = await request(app.getHttpServer())
    .get(url)
    .expect(expectedStatus);

  return res.body as T;
}
