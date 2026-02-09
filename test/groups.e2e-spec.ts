import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../prisma/prisma.service';

describe('Groups (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let groupId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.group.deleteMany(); // tozalash
    await app.close();
  });

  /**
   * CREATE
   */
  it('POST /groups — create group (teacher & room YO‘Q bo‘lsa ham)', async () => {
    const res = await request(app.getHttpServer())
      .post('/groups')
      .send({
        name: 'Backend NestJS',
        price: 1500000,
        capacity: 12,
        teacherId: 'fake-teacher-id',
        roomId: 'fake-room-id',
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Backend NestJS');
    expect(res.body.teacherId).toBe('fake-teacher-id');

    groupId = res.body.id;
  });

  /**
   * LIST
   */
  it('GET /groups — list groups', async () => {
    const res = await request(app.getHttpServer()).get('/groups').expect(200);

    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.meta.total).toBeGreaterThan(0);
  });

  /**
   * GET ONE
   */
  it('GET /groups/:id — get single group', async () => {
    const res = await request(app.getHttpServer())
      .get(`/groups/${groupId}`)
      .expect(200);

    expect(res.body.id).toBe(groupId);
  });

  /**
   * SOFT DELETE
   */
  it('DELETE /groups/:id — soft delete group', async () => {
    await request(app.getHttpServer()).delete(`/groups/${groupId}`).expect(200);

    const groupInDb = await prisma.group.findUnique({
      where: { id: groupId },
    });

    expect(groupInDb.deletedAt).not.toBeNull();
    expect(groupInDb.isActive).toBe(false);
  });

  /**
   * NOT FOUND AFTER DELETE
   */
  it('GET /groups/:id — deleted group not found', async () => {
    await request(app.getHttpServer()).get(`/groups/${groupId}`).expect(404);
  });
});
