import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PostgresTestSetup } from '../config/postgres-test-setup';
import { AppModule } from './../../src/app.module';
import {
  USERS_REPOSITORY,
  UsersRepositoryPort,
} from './../../src/users/application/ports/users-repository.port';
import { Email } from './../../src/users/domain/value-objects/email.vo';

interface UserResponseShape {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

const ADMIN = {
  firstName: 'Root',
  lastName: 'Admin',
  email: 'admin@example.com',
  password: 'admin-password',
};

describe('UsersController (e2e)', () => {
  let app: INestApplication<App>;
  let repository: UsersRepositoryPort;
  let testSetup: PostgresTestSetup;
  let adminToken: string;

  beforeAll(async () => {
    testSetup = await PostgresTestSetup.create(AppModule);
    app = testSetup.app;
    repository = app.get<UsersRepositoryPort>(USERS_REPOSITORY);
  });

  beforeEach(async () => {
    await testSetup.cleanup();
    adminToken = await registerAdmin();
  });

  afterAll(async () => {
    await testSetup?.teardown();
  });

  async function registerAdmin(): Promise<string> {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(ADMIN)
      .expect(201);

    await testSetup.promoteToAdmin(ADMIN.email);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: ADMIN.email, password: ADMIN.password })
      .expect(200);

    return (response.body as { accessToken: string }).accessToken;
  }

  function authenticated(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
  ) {
    const agent = request(app.getHttpServer());
    return agent[method](url).set('Authorization', `Bearer ${adminToken}`);
  }

  async function createUser(payload: {
    firstName: string;
    lastName: string;
    email: string;
  }) {
    await authenticated('post', '/users').send(payload).expect(201);

    const createdUser = await repository.findByEmail(Email.create(payload.email));
    if (!createdUser) {
      throw new Error(`User ${payload.email} was not persisted`);
    }
    return createdUser;
  }

  it('rejects unauthenticated requests', async () => {
    await request(app.getHttpServer()).get('/users').expect(401);
  });

  it('creates a user through /users POST', async () => {
    const response = await authenticated('post', '/users')
      .send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
      role: 'user',
    });

    const persistedUser = await repository.findByEmail(
      Email.create('jane@example.com'),
    );
    expect(persistedUser).toBeTruthy();
    expect(persistedUser?.email.value).toBe('jane@example.com');
  });

  it('rejects a duplicate email with 409', async () => {
    await createUser({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
    });

    const response = await authenticated('post', '/users')
      .send({
        firstName: 'Janet',
        lastName: 'Doe',
        email: 'JANE@example.com',
      })
      .expect(409);

    expect(response.body).toMatchObject({ statusCode: 409 });
  });

  it('lists users through /users GET', async () => {
    await createUser({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
    });

    const response = await authenticated('get', '/users').expect(200);
    const users = response.body as UserResponseShape[];

    expect(users).toHaveLength(2);
    expect(users).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane@example.com',
        }),
      ]),
    );
  });

  it('filters the list by email', async () => {
    await createUser({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
    });

    const response = await authenticated(
      'get',
      '/users?email=jane@example.com',
    ).expect(200);

    expect(response.body as UserResponseShape[]).toHaveLength(1);
  });

  it('finds a user by id through /users/:id GET', async () => {
    const user = await createUser({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
    });

    const response = await authenticated(
      'get',
      `/users/${user.id.value}`,
    ).expect(200);

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

    const response = await authenticated('put', `/users/${user.id.value}`)
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

    const updatedUser = await repository.findByEmail(
      Email.create('janet@example.com'),
    );
    expect(updatedUser?.name.firstName).toBe('Janet');
  });

  it('keeps the role and password of the updated user untouched', async () => {
    const admin = await repository.findByEmail(Email.create(ADMIN.email));

    await authenticated('put', `/users/${admin!.id.value}`)
      .send({
        firstName: 'Renamed',
        lastName: 'Admin',
        email: ADMIN.email,
      })
      .expect(200);

    const reloaded = await repository.findByEmail(Email.create(ADMIN.email));
    expect(reloaded?.role).toBe('admin');
    expect(reloaded?.hasPassword()).toBe(true);
    expect(reloaded?.createdAt).toEqual(admin!.createdAt);

    // The admin token must still work, i.e. the login credentials survived.
    await authenticated('get', '/users').expect(200);
  });

  it('rejects an update that steals another user email', async () => {
    const user = await createUser({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
    });

    await authenticated('put', `/users/${user.id.value}`)
      .send({
        firstName: 'Jane',
        lastName: 'Doe',
        email: ADMIN.email,
      })
      .expect(409);
  });

  it('delete a user through /users/:id DELETE', async () => {
    const user = await createUser({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
    });

    await authenticated('delete', `/users/${user.id.value}`).expect(204);

    expect(await repository.findById(user.id)).toBeNull();
  });

  it('forbids deletion for non admin users', async () => {
    const user = await createUser({
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane@example.com',
    });

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        firstName: 'Plain',
        lastName: 'User',
        email: 'plain@example.com',
        password: 'plain-password',
      })
      .expect(201);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'plain@example.com', password: 'plain-password' })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/users/${user.id.value}`)
      .set(
        'Authorization',
        `Bearer ${(login.body as { accessToken: string }).accessToken}`,
      )
      .expect(403);
  });

  it('should fail to delete a non-existing user through /users/:id DELETE', async () => {
    const id = '10f4677a-cfae-421a-a6e7-6b04b28334f8';

    const response = await authenticated('delete', `/users/${id}`).expect(404);

    expect(response.body).toEqual({
      statusCode: 404,
      message: `User with id '${id}' not found`,
    });
  });

  it('should fail to find a non-existing user through /users/:id GET', async () => {
    const id = 'c9ad18a4-f1e5-47fa-8378-aa0994344188';

    const response = await authenticated('get', `/users/${id}`).expect(404);

    expect(response.body).toEqual({
      statusCode: 404,
      message: `User with id '${id}' not found`,
    });
  });

  describe('auth', () => {
    it('returns the current user through /auth/me', async () => {
      const response = await authenticated('get', '/auth/me').expect(200);

      expect(response.body).toMatchObject({
        email: ADMIN.email,
        firstName: ADMIN.firstName,
        role: 'admin',
      });
      expect(response.body).not.toHaveProperty('password');
    });

    it('rejects a wrong password without revealing which part failed', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: ADMIN.email, password: 'wrong-password' })
        .expect(401);

      expect(response.body).toEqual({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    });

    it('rejects registering an email that is already taken', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ ...ADMIN, email: ADMIN.email.toUpperCase() })
        .expect(409);
    });
  });
});
