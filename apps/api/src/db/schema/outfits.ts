import { pgTable, serial, text, timestamp, uuid, integer, primaryKey } from 'drizzle-orm/pg-core';
import { avatars } from './avatars';
import { items } from './items';
import { users } from './users';
import { boolean } from 'zod';
import { pgEnum } from 'drizzle-orm/pg-core';

// 1-outfit : 1-avatar,n-items

export const outfitStateEnum = pgEnum('outfit_state', ['private', 'public', 'unlisted']);

// コーデ情報を管理するテーブル
export const outfits = pgTable('outfits', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  
  avatarId: uuid('avatar_id').references(() => avatars.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(), // コーデ名
  description: text('description'), // メモ
  imageUrl: text('image_url'), // 完成形のスクショとか
  state: outfitStateEnum('state').default('private').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// コーデの中身 (中間テーブル)
export const outfitItems = pgTable('outfit_items', {
  outfitId: uuid('outfit_id').references(() => outfits.id, { onDelete: 'cascade' }).notNull(),
  itemId: uuid('item_id').references(() => items.id, { onDelete: 'cascade' }).notNull(),
  description: text('description'), // メモ
}, (t) => [
  primaryKey({ columns: [t.outfitId, t.itemId] }),
]);

export type Outfit = typeof outfits.$inferSelect;
export type NewOutfit = typeof outfits.$inferInsert;

export type OutfitItem = typeof outfitItems.$inferSelect;
export type NewOutfitItem = typeof outfitItems.$inferInsert;