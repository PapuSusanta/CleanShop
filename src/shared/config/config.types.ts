import { ConfigService } from '@nestjs/config';

export type NodeEnvironment =
  'development' |
  'production' |
  'test';

export type DatabaseType =
  'mongodb' |
  'postgres';

export interface Env {
  NODE_ENV: NodeEnvironment;
  PORT: number;

  MONGO_URI: string;
  MONGO_DB_NAME: string;

  POSTGRES_URL: string;

  DATABASE: DatabaseType;
}

export class TypesConfigService extends ConfigService<Env> {}
