import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PostgresTestSetup } from '../config/postgres-test-setup';
import { AppModule } from './../../src/app.module';
import {
  USERS_REPOSITORY,
  UsersRepositoryPort,
} from './../../src/users/application/ports/users-repository.port';

interface UserResponseShape {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

describe('UsersController (e2e)', () => {
  let app: INestApplication<App>;
  let repository: UsersRepositoryPort;
  let testSetup: PostgresTestSetup;

  beforeAll(async () => {
    testSetup = await PostgresTestSetup.create(AppModule);
    app = testSetup.app;
    repository = app.get<UsersRepositoryPort>(USERS_REPOSITORY);
  });

  beforeEach(async () => {
    await testSetup.cleanup();
  });

  afterAll(async () => {
    await testSetup?.teardown();
  });

  async function createUser(payload: {
    firstName: string;
    lastName: string;
    email?: string;
  }) {
    const email = payload.email ?? `user-${Date.now()}@example.com`;

    await request(app.getHttpServer())
      .post('/users')
      .send({ ...payload, email })
      .expect(201);

    const createdUser = await repository.findByEmail(email);
    if (!createdUser) {
      throw new Error(`User ${email} was not persisted`);
    }
    return createdUser;
  }

  it('creates a user through /users POST', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
      })
      .expect(201);

    expect(response.text).toBe('');

    const persistedUser = await repository.findByEmail('jane@example.com');
    expect(persistedUser).toBeTruthy();
    expect(persistedUser?.email).toBe('jane@example.com');
  });

  it('lists users through /users GET', async () => {
    await createUser({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
    });

    const response = await request(app.getHttpServer())
      .get('/users')
      .expect(200);

    const users = response.body as UserResponseShape[];

    expect(users).toHaveLength(1);
    expect(users[0]).toMatchObject({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
    });
  });

  it('finds a user by id through /users/:id GET', async () => {
    const user = await createUser({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
    });

    const response = await request(app.getHttpServer())
      .get(`/users/${user.id.value}`)
      .expect(200);

    expect(response.body).toMatchObject({
      id: user.id.value,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
    });
  });

  it('updates a user through /users/:id PUT', async () => {
    const user = await createUser({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
    });

    const response = await request(app.getHttpServer())
      .put(`/users/${user.id.value}`)
      .send({
        firstName: 'Janet',
        lastName: 'Doe',
        email: 'janet@example.com',
      })
      .expect(200);

    expect(response.body).toMatchObject({
      id: user.id.value,
      firstName: 'Janet',
      lastName: 'Doe',
      email: 'janet@example.com',
    });

    const updatedUser = await repository.findByEmail('janet@example.com');
    expect(updatedUser?.firstName).toBe('Janet');
  });

  it('delete a user through /users/:id DELETE', async () => {
    const user = await createUser({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
    });

    await request(app.getHttpServer())
      .delete(`/users/${user.id.value}`)
      .expect(200);
  });

  it('should fail to delete a non-existing user through /users/:id DELETE', async () => {
    const response = await request(app.getHttpServer())
      .delete('/users/10f4677a-cfae-421a-a6e7-6b04b28334f8')
      .expect(404);

    expect(response.body).toEqual({
      statusCode: 404,
      message: 'User with id 10f4677a-cfae-421a-a6e7-6b04b28334f8 not found',
    });
  });

  it('should fail to find a non-existing user through /users/:id GET', async () => {
    const response = await request(app.getHttpServer())
      .get('/users/c9ad18a4-f1e5-47fa-8378-aa0994344188')
      .expect(404);

    expect(response.body).toEqual({
      statusCode: 404,
      message: 'User with ID c9ad18a4-f1e5-47fa-8378-aa0994344188 not found',
    });
  });
});
