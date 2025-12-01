import { Hono } from 'hono';
import { AppEnv } from '@/type';
import { zValidator } from '@hono/zod-validator';
import { db } from '@/db';
import { baseQueryForGetList } from '@/lib/validator';
import { generateCondition } from '@/lib/queryUtils/filter';
import { generateSorting } from '@/lib/queryUtils/sort';
import { outfits } from '@/db/schema/outfits';
import { OutfitRes } from '.';


const list = new Hono<AppEnv>()
  .get(
    '/',
    zValidator('query', baseQueryForGetList(outfits, {
      sortKeys: ['id', 'createdAt'],
      filterKeys: ['id', 'createdAt'],
    })),
    async (c) => {
    try {
      const userId = c.get('userId')!;
      const { limit, offset, sort, order, filter } = c.req.valid('query');
      
      const allAvatars = await db.select().from(outfits)
        .where(generateCondition(outfits, filter, userId))
        .orderBy(generateSorting(outfits, order, sort))
        .limit(limit)
        .offset(offset);

      return c.json<OutfitRes[]>(allAvatars, 200);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Failed to fetch' }, 500);
    }
  }
);
export default list;