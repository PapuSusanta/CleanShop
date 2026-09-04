import type { UsersRepositoryPort } from '../../ports/users-repository.port';
import {
  ApplicationExceptionCode,
  NotFoundException,
} from '../../../../shared/application/exceptions/application.exception';
import { User } from '../../../domain/user.aggregate';
import { Email } from '../../../domain/value-objects/email.vo';
import { HashedPassword } from '../../../domain/value-objects/hashed-password.vo';
import { PersonName } from '../../../domain/value-objects/person-name.vo';
import { GetUserHandler } from './get-user.handler';
import { GetUserQuery } from './get-user.query';

function repositoryStub(
  overrides: Partial<UsersRepositoryPort> = {},
): UsersRepositoryPort {
  return {
    save: jest.fn(),
    delete: jest.fn(),
    findById: jest.fn().mockResolvedValue(null),
    findByEmail: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    existsByEmail: jest.fn().mockResolvedValue(false),
    ...overrides,
  };
}

describe('getUserHandler', () => {
  const id = 'c989db2f-2926-4795-adfb-cea08fbba448';

  it('throws NotFoundException when the user does not exist', async () => {
    const handler = new GetUserHandler(repositoryStub());

    await expect(handler.execute(new GetUserQuery(id))).rejects.toMatchObject({
      code: ApplicationExceptionCode.NOT_FOUND,
      message: `User with id '${id}' not found`,
    });
    await expect(handler.execute(new GetUserQuery(id))).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('returns a read model rather than the aggregate itself', async () => {
    const user = User.register(
      PersonName.create('Ada', 'Lovelace'),
      Email.create('ada@example.com'),
      HashedPassword.fromHash('$2b$10$hash'),
    );
    const handler = new GetUserHandler(
      repositoryStub({ findById: jest.fn().mockResolvedValue(user) }),
    );

    const view = await handler.execute(new GetUserQuery(user.id.value));

    expect(view).toMatchObject({
      id: user.id.value,
      firstName: 'Ada',
      lastName: 'Lovelace',
      fullName: 'Ada Lovelace',
      email: 'ada@example.com',
    });
    expect(view).not.toBeInstanceOf(User);
    expect(view).not.toHaveProperty('password');
  });
});
