import { AggregateRoot } from '../../shared/domain/aggregate-root';
import { Role } from '../../shared/domain/enums/role.enum';
import { DomainException } from '../../shared/domain/exceptions/domain.exception';
import { UserCreatedEvent } from './events/user-created.event';
import { UserDeletedEvent } from './events/user-deleted.event';
import { UserEmailChangedEvent } from './events/user-email-changed.event';
import { UserRegisteredEvent } from './events/user-registered.event';
import { UserRenamedEvent } from './events/user-renamed.event';
import { Email } from './value-objects/email.vo';
import { HashedPassword } from './value-objects/hashed-password.vo';
import { PersonName } from './value-objects/person-name.vo';
import { UserId } from './value-objects/user-id.vo';

export interface UserSnapshot {
  id: UserId;
  name: PersonName;
  email: Email;
  password?: HashedPassword;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * The user aggregate root.
 *
 * Every state change goes through a method on this class, so the invariants
 * live in one place and each change records the domain event that describes it.
 */
export class User extends AggregateRoot<UserId> {
  private _name: PersonName;
  private _email: Email;
  private _password?: HashedPassword;
  private _role: Role;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: UserSnapshot) {
    super(props.id);
    this._name = props.name;
    this._email = props.email;
    this._password = props.password;
    this._role = props.role;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // --- Factories -----------------------------------------------------------

  /** Somebody signing themselves up: they bring a password. */
  static register(
    name: PersonName,
    email: Email,
    password: HashedPassword,
    role: Role = Role.USER,
  ): User {
    const now = new Date();
    const user = new User({
      id: UserId.create(),
      name,
      email,
      password,
      role,
      createdAt: now,
      updatedAt: now,
    });

    user.addDomainEvent(
      new UserRegisteredEvent(
        user.id.value,
        user.email.value,
        user.name.fullName,
        user.role,
      ),
    );

    return user;
  }

  /** A user created on their behalf: no password yet, so they cannot log in. */
  static create(name: PersonName, email: Email, role: Role = Role.USER): User {
    const now = new Date();
    const user = new User({
      id: UserId.create(),
      name,
      email,
      role,
      createdAt: now,
      updatedAt: now,
    });

    user.addDomainEvent(
      new UserCreatedEvent(
        user.id.value,
        user.email.value,
        user.name.fullName,
        user.role,
      ),
    );

    return user;
  }

  /**
   * Rebuilds an aggregate that already exists. Reserved for repositories:
   * it restores state as-is and deliberately raises no events.
   */
  static fromPersistence(snapshot: UserSnapshot): User {
    return new User(snapshot);
  }

  // --- Behaviour -----------------------------------------------------------

  rename(name: PersonName): void {
    if (this._name.equals(name)) {
      return;
    }

    const previousFullName = this._name.fullName;
    this._name = name;
    this.touch();

    this.addDomainEvent(
      new UserRenamedEvent(this.id.value, previousFullName, name.fullName),
    );
  }

  changeEmail(email: Email): void {
    if (this._email.equals(email)) {
      return;
    }

    const previousEmail = this._email.value;
    this._email = email;
    this.touch();

    this.addDomainEvent(
      new UserEmailChangedEvent(this.id.value, previousEmail, email.value),
    );
  }

  /** Marks the aggregate as removed; the repository performs the deletion. */
  delete(): void {
    this.addDomainEvent(new UserDeletedEvent(this.id.value, this._email.value));
  }

  hasPassword(): boolean {
    return this._password !== undefined;
  }

  isAdmin(): boolean {
    return this._role === Role.ADMIN;
  }

  /**
   * Comparing a plain text password against this hash needs an algorithm the
   * domain must not know about, so the aggregate exposes the hash to the
   * application layer instead of pretending it can verify it itself.
   */
  passwordHash(): HashedPassword {
    if (!this._password) {
      throw new DomainException(
        `User '${this.id.value}' has no password configured`,
      );
    }
    return this._password;
  }

  // --- State ---------------------------------------------------------------

  get name(): PersonName {
    return this._name;
  }

  get email(): Email {
    return this._email;
  }

  get role(): Role {
    return this._role;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /** Full state, for repositories that need to write every column. */
  toSnapshot(): UserSnapshot {
    return {
      id: this.id,
      name: this._name,
      email: this._email,
      password: this._password,
      role: this._role,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }

  private touch(): void {
    this._updatedAt = new Date();
  }
}
