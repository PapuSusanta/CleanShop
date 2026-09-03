import type {
  UsersFilter,
  UsersRepositoryPort,
} from '../../application/ports/users-repository.port';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { Collection, Db, Filter, MongoServerError } from 'mongodb';
import { Role } from '../../../shared/domain/enums/role.enum';
import {
  ApplicationException,
  ApplicationExceptionCode,
} from '../../../shared/domain/exceptions/application.exception';
import { MONGO_DB } from '../../../shared/infrastructure/database/mongodb/mongo.provider';
import { User } from '../../domain/user.aggregate';
import { Email } from '../../domain/value-objects/email.vo';
import { HashedPassword } from '../../domain/value-objects/hashed-password.vo';
import { PersonName } from '../../domain/value-objects/person-name.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';

const DUPLICATE_KEY = 11000;
const DEFAULT_LIMIT = 50;

interface UserDocument {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class MongoUsersRepository implements UsersRepositoryPort, OnModuleInit {
  private readonly collection: Collection<UserDocument>;

  constructor(@Inject(MONGO_DB) private readonly db: Db) {
    this.collection = this.db.collection<UserDocument>('users');
  }

  /** Postgres gets its unique index from a migration; Mongo needs it declared. */
  async onModuleInit(): Promise<void> {
    await this.collection.createIndex({ email: 1 }, { unique: true });
  }

  async save(user: User): Promise<void> {
    const document = MongoUsersRepository.toDocument(user);

    try {
      await this.collection.replaceOne({ _id: document._id }, document, {
        upsert: true,
      });
    }
    catch (error) {
      throw MongoUsersRepository.translate(error, document.email);
    }
  }

  async delete(user: User): Promise<void> {
    await this.collection.deleteOne({ _id: user.id.value });
  }

  async findById(id: UserId): Promise<User | null> {
    const document = await this.collection.findOne({ _id: id.value });

    return document ? MongoUsersRepository.toDomain(document) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const document = await this.collection.findOne({ email: email.value });

    return document ? MongoUsersRepository.toDomain(document) : null;
  }

  async findAll(filter: UsersFilter): Promise<User[]> {
    const query: Filter<UserDocument> = {};

    if (filter.email) {
      query.email = filter.email.value;
    }

    const documents = await this.collection
      .find(query)
      .sort({ createdAt: 1 })
      .skip(filter.offset ?? 0)
      .limit(filter.limit ?? DEFAULT_LIMIT)
      .toArray();

    return documents.map(MongoUsersRepository.toDomain);
  }

  async existsByEmail(email: Email): Promise<boolean> {
    const count = await this.collection.countDocuments(
      { email: email.value },
      { limit: 1 },
    );

    return count > 0;
  }

  // --- Mapping -------------------------------------------------------------

  private static toDocument(user: User): UserDocument {
    const snapshot = user.toSnapshot();

    return {
      _id: snapshot.id.value,
      firstName: snapshot.name.firstName,
      lastName: snapshot.name.lastName,
      email: snapshot.email.value,
      password: snapshot.password?.value,
      role: snapshot.role,
      createdAt: snapshot.createdAt,
      updatedAt: snapshot.updatedAt,
    };
  }

  private static toDomain(document: UserDocument): User {
    return User.fromPersistence({
      id: UserId.fromString(document._id),
      name: PersonName.create(document.firstName, document.lastName),
      email: Email.create(document.email),
      password: document.password ?
          HashedPassword.fromHash(document.password) :
        undefined,
      role: document.role,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }

  private static translate(error: unknown, email: string): unknown {
    if (error instanceof MongoServerError && error.code === DUPLICATE_KEY) {
      return new ApplicationException(
        `A user with email '${email}' already exists`,
        ApplicationExceptionCode.CONFLICT,
      );
    }

    return error;
  }
}
