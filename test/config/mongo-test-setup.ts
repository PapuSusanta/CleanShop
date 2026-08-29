import {
  DynamicModule,
  ForwardReference,
  INestApplication,
  Type,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoClient } from 'mongodb';
import { App } from 'supertest/types';
import { ApplicationExceptionFilter } from '../../src/shared/infrastructure/filters/application-exception.filter';
import { DomainExceptionFilter } from '../../src/shared/infrastructure/filters/domain-exception.filter';
import { testConfig } from './test-config';

export class MongoTestSetup {
  app!: INestApplication<App>;
  private readonly mongoUri: string;
  private readonly databaseName: string;
  private client?: MongoClient;

  constructor(
    mongoUri: string = testConfig.MONGO_URI,
    databaseName: string = `${testConfig.MONGO_DB_NAME}_${Date.now()}`,
  ) {
    this.mongoUri = mongoUri;
    this.databaseName = databaseName;
  }

  static async create(
    module:
      | Type<any> |
      DynamicModule |
      Promise<DynamicModule> |
      ForwardReference<any>,
  ) {
    const instance = new MongoTestSetup();
    await instance.init(module);
    return instance;
  }

  private async init(
    module:
      | Type<any> |
      DynamicModule |
      Promise<DynamicModule> |
      ForwardReference<any>,
  ) {
    this.client = new MongoClient(this.mongoUri);
    await this.client.connect();
    await this.client.db(this.databaseName).command({ ping: 1 });

    const getConfigValue = (key: string, defaultValue?: string) => {
      switch (key) {
        case 'POSTGRES_URL':
          return testConfig.POSTGRES_URL;
        case 'MONGO_URI':
          return this.mongoUri;
        case 'MONGO_DB_NAME':
          return this.databaseName;
        case 'DATABASE':
          return 'mongodb';
        default:
          return defaultValue ?? null;
      }
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [module],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: getConfigValue,
        getOrThrow: (key: string) => {
          const value = getConfigValue(key);
          if (value == null || value === '') {
            throw new Error(`Missing config value for ${key}`);
          }
          return value;
        },
      })
      .compile();

    this.app = moduleFixture.createNestApplication();
    this.app.useGlobalFilters(
      new ApplicationExceptionFilter(),
      new DomainExceptionFilter(),
    );
    await this.app.init();
  }

  async cleanup() {
    if (!this.client) {
      return;
    }

    await this.client
      .db(this.databaseName)
      .dropDatabase()
      .catch(() => undefined);
  }

  async teardown() {
    if (this.app) {
      await this.app.close();
    }

    if (this.client) {
      await this.client.close();
      this.client = undefined;
    }
  }
}
