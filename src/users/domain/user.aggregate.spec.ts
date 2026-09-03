import { Role } from '../../shared/domain/enums/role.enum';
import { DomainException } from '../../shared/domain/exceptions/domain.exception';
import { UserCreatedEvent } from './events/user-created.event';
import { UserEmailChangedEvent } from './events/user-email-changed.event';
import { UserRegisteredEvent } from './events/user-registered.event';
import { UserRenamedEvent } from './events/user-renamed.event';
import { User } from './user.aggregate';
import { Email } from './value-objects/email.vo';
import { HashedPassword } from './value-objects/hashed-password.vo';
import { PersonName } from './value-objects/person-name.vo';

const name = () => PersonName.create('Ada', 'Lovelace');
const email = (value = 'ada@example.com') => Email.create(value);
const password = () => HashedPassword.fromHash('$2b$10$hash');

describe('user aggregate', () => {
  describe('registration', () => {
    it('records a UserRegisteredEvent and keeps the password', () => {
      const user = User.register(name(), email(), password());

      expect(user.hasPassword()).toBe(true);
      expect(user.role).toBe(Role.USER);
      expect(user.domainEvents).toHaveLength(1);
      expect(user.domainEvents[0]).toBeInstanceOf(UserRegisteredEvent);
    });

    it('creates users without a password so they cannot log in yet', () => {
      const user = User.create(name(), email());

      expect(user.hasPassword()).toBe(false);
      expect(user.domainEvents[0]).toBeInstanceOf(UserCreatedEvent);
      expect(() => user.passwordHash()).toThrow(DomainException);
    });
  });

  describe('rename', () => {
    it('records a UserRenamedEvent and touches updatedAt', () => {
      const user = User.register(name(), email(), password());
      user.pullDomainEvents();
      const before = user.updatedAt;

      user.rename(PersonName.create('Ada', 'Byron'));

      expect(user.name.fullName).toBe('Ada Byron');
      expect(user.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(user.domainEvents[0]).toBeInstanceOf(UserRenamedEvent);
    });

    it('stays silent when the name did not actually change', () => {
      const user = User.register(name(), email(), password());
      user.pullDomainEvents();

      user.rename(PersonName.create('Ada', 'Lovelace'));

      expect(user.domainEvents).toHaveLength(0);
    });
  });

  describe('changeEmail', () => {
    it('records a UserEmailChangedEvent carrying the previous address', () => {
      const user = User.register(name(), email(), password());
      user.pullDomainEvents();

      user.changeEmail(email('ada@lovelace.dev'));

      const [event] = user.domainEvents as UserEmailChangedEvent[];
      expect(event).toBeInstanceOf(UserEmailChangedEvent);
      expect(event.previousEmail).toBe('ada@example.com');
      expect(event.email).toBe('ada@lovelace.dev');
    });

    it('treats addresses that differ only in case as unchanged', () => {
      const user = User.register(name(), email(), password());
      user.pullDomainEvents();

      user.changeEmail(email('ADA@Example.com'));

      expect(user.domainEvents).toHaveLength(0);
    });
  });

  it('pullDomainEvents drains the buffer', () => {
    const user = User.register(name(), email(), password());

    expect(user.pullDomainEvents()).toHaveLength(1);
    expect(user.pullDomainEvents()).toHaveLength(0);
  });

  it('compares users by identity, not by attributes', () => {
    const one = User.register(name(), email(), password());
    const other = User.fromPersistence({ ...one.toSnapshot() });
    other.rename(PersonName.create('Grace', 'Hopper'));

    expect(one.equals(other)).toBe(true);
    expect(one.equals(User.register(name(), email('x@y.dev'), password()))).toBe(
      false,
    );
  });
});
