/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from 'prisma/prisma.service';

describe('Rooms (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let roomId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);

    // 🔥 testdan oldin roomlarni tozalaymiz
    await prisma.room.deleteMany();
  });

  afterAll(async () => {
    await prisma.room.deleteMany();
    await app.close();
  });

  it('POST /rooms → create room', async () => {
    const res = await request(app.getHttpServer())
      .post('/rooms')
      .send({
        name: 'Room A',
        capacity: 30,
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Room A');
    expect(res.body.capacity).toBe(30);
    expect(res.body.isActive).toBe(true);

    roomId = res.body.id;
  });

  it('POST /rooms → duplicate name should fail', async () => {
    await request(app.getHttpServer())
      .post('/rooms')
      .send({
        name: 'Room A',
        capacity: 20,
      })
      .expect(409);
  });

  it('GET /rooms → list rooms', async () => {
    const res = await request(app.getHttpServer()).get('/rooms').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });

  it('GET /rooms/:id → get one room', async () => {
    const res = await request(app.getHttpServer())
      .get(`/rooms/${roomId}`)
      .expect(200);

    expect(res.body.id).toBe(roomId);
    expect(res.body.name).toBe('Room A');
  });

  it('PATCH /rooms/:id → update room', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/rooms/${roomId}`)
      .send({
        capacity: 40,
      })
      .expect(200);

    expect(res.body.capacity).toBe(40);
  });

  it('DELETE /rooms/:id → soft delete room', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/rooms/${roomId}`)
      .expect(200);

    expect(res.body.isActive).toBe(false);
    expect(res.body.deletedAt).toBeTruthy();
  });

  it('GET /rooms → empty after delete', async () => {
    const res = await request(app.getHttpServer()).get('/rooms').expect(200);

    expect(res.body.length).toBe(0);
  });
});
