import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  DynamicModule,
  ForwardReference,
  INestApplication,
  Type,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import postgres, { Sql } from 'postgres';
import { App } from 'supertest/types';
import { ApplicationExceptionFilter } from '../../src/shared/infrastructure/filters/application-exception.filter';
import { DomainExceptionFilter } from '../../src/shared/infrastructure/filters/domain-exception.filter';
import { testConfig } from './test-config';

export class PostgresTestSetup {
  app!: INestApplication<App>;
  private readonly postgresUrl: string;
  private readonly databaseName: string;
  private client?: Sql;

  constructor(postgresUrl: string = testConfig.POSTGRES_URL) {
    this.postgresUrl = postgresUrl;
    this.databaseName = `clean_shop_test_${Date.now()}`;
  }

  static async create(
    module:
      | Type<any> |
      DynamicModule |
      Promise<DynamicModule> |
      ForwardReference<any>,
  ): Promise<PostgresTestSetup> {
    const instance = new PostgresTestSetup();
    await instance.init(module);
    return instance;
  }

  private async init(
    module:
      | Type<any> |
      DynamicModule |
      Promise<DynamicModule> |
      ForwardReference<any>,
  ): Promise<void> {
    await this.ensureDatabaseExists();
    await this.applySchema();

    const getConfigValue = (key: string, defaultValue?: string) => {
      switch (key) {
        case 'POSTGRES_URL':
          return this.getDatabaseUrl();
        case 'MONGO_URI':
          return testConfig.MONGO_URI;
        case 'MONGO_DB_NAME':
          return testConfig.MONGO_DB_NAME;
        case 'DATABASE':
          return testConfig.DATABASE;
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

    const tables = await this.client<{ tablename: string }[]>`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename NOT LIKE 'pg_%'
        AND tablename NOT LIKE 'sql_%'
    `;

    for (const table of tables) {
      await this.client.unsafe(
        `TRUNCATE TABLE "${table.tablename}" RESTART IDENTITY CASCADE;`,
      );
    }
  }

  async teardown() {
    if (this.app) {
      await this.app.close();
    }

    if (this.client) {
      await this.client.end();
      this.client = undefined;
    }

    await this.dropDatabase();
  }

  private async ensureDatabaseExists() {
    const adminUrl = this.postgresUrl.replace(/\/[^/]+$/, '/postgres');
    const adminClient = postgres(adminUrl, { max: 1 });

    try {
      await adminClient.unsafe(`CREATE DATABASE "${this.databaseName}"`);
    }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes('already exists')) {
        throw error;
      }
    }
    finally {
      await adminClient.end();
    }
  }

  private async applySchema() {
    if (!this.client) {
      this.client = postgres(this.getDatabaseUrl(), { max: 1 });
    }

    await this.cleanup();

    const migrationsDir = path.resolve(__dirname, '../../drizzle');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(fileName => fileName.endsWith('.sql'))
      .sort((left, right) => left.localeCompare(right));

    for (const fileName of migrationFiles) {
      const migrationPath = path.join(migrationsDir, fileName);
      const migrationSql = readFileSync(migrationPath, 'utf8');
      await this.client.unsafe(migrationSql);
    }
  }

  private getDatabaseUrl() {
    const parsedUrl = new URL(this.postgresUrl);
    parsedUrl.pathname = `/${this.databaseName}`;
    return parsedUrl.toString();
  }

  private async dropDatabase() {
    const adminUrl = this.postgresUrl.replace(/\/[^/]+$/, '/postgres');
    const adminClient = postgres(adminUrl, { max: 1 });

    try {
      await adminClient.unsafe(
        `DROP DATABASE IF EXISTS "${this.databaseName}" WITH (FORCE);`,
      );
    }
    catch (error) {
      if (
        !(error instanceof Error) ||
        !error.message.includes('being accessed by other users')
      ) {
        throw error;
      }
    }
    finally {
      await adminClient.end();
    }
  }
}
