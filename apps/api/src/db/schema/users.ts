import { pgTable, text, boolean, timestamp, uuid, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  handle: text('handle').unique().notNull(),
  email: text('email').unique().notNull(),
  password: text('password').notNull(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  index('users_handle_index').on(t.handle),
  index('users_email_index').on(t.email),
]);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;