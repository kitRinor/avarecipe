import { pgTable, serial, text, timestamp, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { users } from './users';
import { uniqueIndex } from 'drizzle-orm/pg-core';
import { index } from 'drizzle-orm/pg-core';

export const itemCategoryEnum = pgEnum('item_category', ['cloth', 'hair', 'accessory', 'texture', 'prop', 'gimmick', 'other']);

// アイテム(衣装，髪形，ギミック)情報を管理するテーブル
export const items = pgTable('items', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  
  category: itemCategoryEnum('category').default('cloth').notNull(),
  
  storeUrl: text('store_url'),
  sourceKey: text('source_key'), // <store>:<assetID> 例: booth:1234567

  thumbnailUrl: text('thumbnail_url'),
  createdAt: timestamp('created_at').defaultNow(),
}, (t) => [
  uniqueIndex('items_user_source_unique').on(t.userId, t.sourceKey),
  index('items_source_index').on(t.userId, t.sourceKey),
]);

export type Item = typeof items.$inferSelect;
export type NewItem = typeof items.$inferInsert;