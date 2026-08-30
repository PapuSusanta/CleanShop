import { pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { Role } from '../../../../domain/enums/role.enum';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }),
  role: varchar('role', { length: 20 })
    .$type<Role>()
    .notNull()
    .default(Role.USER),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});
