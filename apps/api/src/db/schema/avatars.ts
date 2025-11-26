import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { users } from './users'; 
import { uniqueIndex } from 'drizzle-orm/pg-core';

// アバター情報を管理するテーブル
export const avatars = pgTable('avatars', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  storeUrl: text('store_url'),
  sourceKey: text('source_key'), // <store>:<assetID> 例: booth.pm:1234567
  thumbnailUrl: text('thumbnail_url'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  uniqueIndex('avatars_user_source_unique').on(t.userId, t.sourceKey),
  index('avatars_source_index').on(t.userId, t.sourceKey)
]);

export type Avatar = typeof avatars.$inferSelect;
export type NewAvatar = typeof avatars.$inferInsert;



