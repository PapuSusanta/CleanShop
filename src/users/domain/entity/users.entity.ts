import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { Role } from '../../../shared/domain/enums/role.enum';
import { DomainException } from '../../../shared/domain/exceptions/domain.exception';
import { UserId } from '../value-objects/user-id';

interface UsersProps {
  id: UserId;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export class Users extends AggregateRoot {
  private _id: UserId;
  private _firstName: string;
  private _lastName: string;
  private _email: string;
  private _password?: string;
  private _role: Role;
  private _createdAt: Date;
  private _updatedAt: Date;
  private constructor(props: UsersProps) {
    super();
    this._id = props.id;
    this._firstName = props.firstName;
    this._lastName = props.lastName;
    this._email = props.email;
    this._password = props.password;
    this._role = props.role;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  // Static factory methods
  static createUnique(
    firstName: string,
    lastName: string,
    email: string,
    password?: string,
    role: Role = Role.USER,
  ) {
    Users.ValidateFirstName(firstName);
    Users.ValidateLastName(lastName);
    const now = new Date();
    return new Users({
      id: new UserId(),
      firstName,
      lastName,
      email,
      password,
      role,
      createdAt: now,
      updatedAt: now,
    });
  }

  static create(
    id: UserId,
    firstName: string,
    lastName: string,
    email: string,
    password?: string,
    role: Role = Role.USER,
  ) {
    Users.ValidateFirstName(firstName);
    Users.ValidateLastName(lastName);
    const now = new Date();
    return new Users({
      id,
      firstName,
      lastName,
      email,
      password,
      role,
      createdAt: now,
      updatedAt: now,
    });
  }

  static toEntity(props: UsersProps): Users {
    return new Users(props);
  }

  // Getter methods
  get id(): UserId {
    return this._id;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get email(): string {
    return this._email;
  }

  get password(): string | undefined {
    return this._password;
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

  // Validation functions
  private static ValidateFirstName(firstName: string) {
    if (
      firstName === '' ||
      firstName === undefined ||
      firstName?.length === 0
    ) {
      throw new DomainException('First name can not be empty');
    }
  }

  private static ValidateLastName(lastName: string) {
    if (lastName === '' || lastName === undefined || lastName?.length === 0) {
      throw new DomainException('Last name can not be empty');
    }
  }
}
