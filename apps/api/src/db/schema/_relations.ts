import { relations } from 'drizzle-orm';
import { users } from './users';
import { avatars } from './avatars';
import { items } from './items';
import { compatibility } from './compatibility';
import { outfitItems, outfits } from './outfits';
import { profiles } from './profiles';


// テーブル間のリレーション設定

// users table relations 
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }), // 1-user : 1-profile
  avatars: many(avatars), // 1-user : n-avatars
  items: many(items), // 1-user : n-items
}));
// profiles table relations
export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.id] }),
}));
// avatars table relations
export const avatarsRelations = relations(avatars, ({ one, many }) => ({
  user: one(users, { fields: [avatars.userId], references: [users.id] }),
  compatibilities: many(compatibility), // 1-avatar : n-compatibilities
}));

// items table relations
export const itemsRelations = relations(items, ({ one, many }) => ({
  user: one(users, { fields: [items.userId], references: [users.id] }),
  compatibilities: many(compatibility), // 1-item : n-compatibilities
}));

// compatibilities table relations
export const compatibilityRelations = relations(compatibility, ({ one }) => ({
  user: one(users, { fields: [compatibility.userId], references: [users.id] }),
  avatar: one(avatars, { fields: [compatibility.avatarId], references: [avatars.id] }),
  item: one(items, {fields: [compatibility.itemId], references: [items.id] }),
}));

// outfits table relations
export const outfitsRelations = relations(outfits, ({ one, many }) => ({
  user: one(users, { fields: [outfits.userId], references: [users.id] }),
  avatar: one(avatars, { fields: [outfits.avatarId], references: [avatars.id] }),
  items: many(outfitItems), // 1-outfit : n-outfitItems
}));
// outfitItems table relations
export const outfitItemsRelations = relations(outfitItems, ({ one }) => ({
  outfit: one(outfits, { fields: [outfitItems.outfitId], references: [outfits.id] }),
  item: one(items, { fields: [outfitItems.itemId], references: [items.id] }),
}));