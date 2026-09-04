import type { UsersRepositoryPort } from '../../ports/users-repository.port';
import { ApplicationExceptionCode } from '../../../../shared/application/exceptions/application.exception';
import { Role } from '../../../../shared/domain/enums/role.enum';
import { UserEmailChangedEvent } from '../../../domain/events/user-email-changed.event';
import { User } from '../../../domain/user.aggregate';
import { Email } from '../../../domain/value-objects/email.vo';
import { HashedPassword } from '../../../domain/value-objects/hashed-password.vo';
import { PersonName } from '../../../domain/value-objects/person-name.vo';
import { UpdateUserCommand } from './update-user.command';
import { UpdateUserHandler } from './update-user.handler';

function existingAdmin(): User {
  const user = User.register(
    PersonName.create('Ada', 'Lovelace'),
    Email.create('ada@example.com'),
    HashedPassword.fromHash('$2b$10$hash'),
    Role.ADMIN,
  );
  user.pullDomainEvents();
  return user;
}

function build(user: User | null, overrides: Partial<UsersRepositoryPort> = {}) {
  const repository: UsersRepositoryPort = {
    save: jest.fn(),
    delete: jest.fn(),
    findById: jest.fn().mockResolvedValue(user),
    findByEmail: jest.fn().mockResolvedValue(null),
    findAll: jest.fn().mockResolvedValue([]),
    existsByEmail: jest.fn().mockResolvedValue(false),
    ...overrides,
  };
  const publisher = { publishAll: jest.fn().mockResolvedValue(undefined) };

  return {
    repository,
    publisher,
    handler: new UpdateUserHandler(repository, publisher),
  };
}

describe('updateUserHandler', () => {
  it('preserves the password, role and createdAt of the stored user', async () => {
    const user = existingAdmin();
    const { handler, repository } = build(user);

    await handler.execute(
      new UpdateUserCommand(
        user.id.value,
        'Grace',
        'Hopper',
        'grace@example.com',
      ),
    );

    const [saved] = (repository.save as jest.Mock).mock.calls[0] as [User];
    expect(saved.name.fullName).toBe('Grace Hopper');
    expect(saved.email.value).toBe('grace@example.com');
    expect(saved.role).toBe(Role.ADMIN);
    expect(saved.hasPassword()).toBe(true);
    expect(saved.createdAt).toEqual(user.createdAt);
  });

  it('publishes the events produced by the change', async () => {
    const user = existingAdmin();
    const { handler, publisher } = build(user);

    await handler.execute(
      new UpdateUserCommand(user.id.value, 'Ada', 'Lovelace', 'ada@byron.dev'),
    );

    const [events] = publisher.publishAll.mock.calls[0] as [unknown[]];
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(UserEmailChangedEvent);
  });

  it('rejects an email that belongs to another user', async () => {
    const user = existingAdmin();
    const other = User.create(
      PersonName.create('Grace', 'Hopper'),
      Email.create('grace@example.com'),
    );
    const { handler, repository } = build(user, {
      findByEmail: jest.fn().mockResolvedValue(other),
    });

    await expect(
      handler.execute(
        new UpdateUserCommand(
          user.id.value,
          'Ada',
          'Lovelace',
          'grace@example.com',
        ),
      ),
    ).rejects.toMatchObject({ code: ApplicationExceptionCode.CONFLICT });

    expect(repository.save).not.toHaveBeenCalled();
  });

  it('allows keeping the same email', async () => {
    const user = existingAdmin();
    const { handler, repository } = build(user, {
      findByEmail: jest.fn().mockResolvedValue(user),
    });

    await handler.execute(
      new UpdateUserCommand(user.id.value, 'Ada', 'Byron', 'ada@example.com'),
    );

    expect(repository.save).toHaveBeenCalled();
  });

  it('reports NOT_FOUND instead of creating a user', async () => {
    const { handler, repository } = build(null);

    await expect(
      handler.execute(
        new UpdateUserCommand(
          'c989db2f-2926-4795-adfb-cea08fbba448',
          'Ada',
          'Lovelace',
          'ada@example.com',
        ),
      ),
    ).rejects.toMatchObject({ code: ApplicationExceptionCode.NOT_FOUND });

    expect(repository.save).not.toHaveBeenCalled();
  });
});
