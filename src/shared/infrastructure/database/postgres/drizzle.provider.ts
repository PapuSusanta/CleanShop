import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { DrizzleService } from './drizzle.service';
import * as schema from './schemas';

export const DRIZZLE = Symbol('DRIZZLE');

export type DrizzleDb = PostgresJsDatabase<typeof schema>;

export const DrizzleProvider = {
  provide: DRIZZLE,
  inject: [DrizzleService],
  useFactory: (drizzleService: DrizzleService): DrizzleDb => drizzleService.db,
};

// export const DrizzleProvider = {
//   provide: DRIZZLE,
//   inject: [DrizzleService],
//   useFactory: (drizzleService: DrizzleService) => drizzleService.db,
// };
