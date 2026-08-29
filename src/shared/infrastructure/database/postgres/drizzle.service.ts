import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { sql } from 'drizzle-orm/sql/sql';
import postgres, { Sql } from 'postgres';
import { TypesConfigService } from '../../../config/config.types';
import * as schema from './schemas';

@Injectable()
export class DrizzleService implements OnModuleDestroy {
  private readonly client: Sql;
  readonly db: PostgresJsDatabase<typeof schema>;

  constructor(private readonly configService: TypesConfigService) {
    // const connectionString = env.POSTGRES_URL;
    const connectionString =
      this.configService.getOrThrow<string>('POSTGRES_URL');
    this.client = postgres(connectionString);
    this.db = drizzle(this.client, { schema });
  }

  async onModuleDestroy() {
    await this.client.end();
  }

  async init() {
    await this.db.execute(sql`SELECT 1`);
  }
}
