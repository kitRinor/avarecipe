import { Hono } from 'hono';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { TEMP_USER_ID } from '../const';
import { avatars } from '@/db/schema/avatars';
import { items } from '@/db/schema/items';
import { compatibility } from '@/db/schema/compatibility';
import { requireAuth } from '@/middleware/auth';
import { AvatarRes } from './avatars';
import { ItemRes } from './items';
import { CompatibilityRes } from './compatibility';

export interface MatrixRes {
  avatars: AvatarRes[];
  items: ItemRes[];
  compatibilities: CompatibilityRes[];
}

const app = new Hono()
.use(requireAuth)
// GET /matrix
.get('/', async (c) => {
  try {
    const userId = c.get('userId')!;
    // Fetch data concurrently for better performance
    const [allAvatars, allItems, allCompatibilities] = await Promise.all([
      db.select().from(avatars).where(eq(avatars.userId, userId)).orderBy(avatars.id),
      db.select().from(items).where(eq(items.userId, userId)).orderBy(items.id),
      db.select().from(compatibility).where(eq(compatibility.userId, userId)),
    ]);

    return c.json<MatrixRes>({
      avatars: allAvatars,
      items: allItems,
      compatibilities: allCompatibilities,
    });
  } catch (e) {
    console.error(e);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
})

export default app;