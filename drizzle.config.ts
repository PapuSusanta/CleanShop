import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/shared/infrastructure/database/postgres/schemas/index.ts',
  out: './drizzle',
  dbCredentials: {
    // eslint-disable-next-line node/no-process-env
    url: process.env.POSTGRES_URL!,
  },
});
