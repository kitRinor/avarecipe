
import { Hono } from 'hono';
import { AppEnv } from '@/type';
import { zValidator } from '@hono/zod-validator';
import { db } from '@/db';
import { baseQueryForGetList } from '@/lib/validator';
import { generateCondition } from '@/lib/queryUtils/filter';
import { generateSorting } from '@/lib/queryUtils/sort';
import { TEMP_USER_ID } from '@/const';
import { items } from '@/db/schema/items';
import { ItemRes } from '.';


const list = new Hono<AppEnv>()
  .get(
    '/', 
    zValidator('query', baseQueryForGetList(items, {
      sortKeys: ['id', 'createdAt'],
      filterKeys: ['id', 'name', 'createdAt'],
    })),
    async (c) => {
      try {
        const userId = c.get('userId')!;
        const { limit, offset, sort, order, filter } = c.req.valid('query');
        
        const allAvatars = await db.select().from(items)
          .where(generateCondition(items, filter, userId))
          .orderBy(generateSorting(items, order, sort))
          .limit(limit)
          .offset(offset);

        return c.json<ItemRes[]>(allAvatars, 200);
      } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to fetch' }, 500);
      }
    }
  );
export default list;