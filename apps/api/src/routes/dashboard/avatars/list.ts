import { createFactory } from 'hono/factory';
import { zValidator } from '@hono/zod-validator';
import { db } from '@/db';
import { baseQueryForGetList } from '@/lib/validator';
import { generateCondition } from '@/lib/queryUtils/filter';
import { generateSorting } from '@/lib/queryUtils/sort';
import { Avatar, avatars } from '@/db/schema/avatars';
import { AppEnv } from '@/type';
import { Hono } from 'hono';
import { AvatarRes } from '.';


const list = new Hono<AppEnv>()
  .get(
    '/',
    zValidator('query', baseQueryForGetList(avatars, {
      sortKeys: ['id', 'createdAt'],
      filterKeys: ['id', 'name', 'createdAt'],
    })),
    async (c) => {
      try {
        const userId = c.get('userId')!;
        const { limit, offset, sort, order, filter } = c.req.valid('query');
        
        const result = await db.select().from(avatars)
          .where(generateCondition(avatars, filter, userId))
          .orderBy(generateSorting(avatars, order, sort))
          .limit(limit)
          .offset(offset);

        return c.json<AvatarRes[]>(result, 200);
      } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to fetch avatars' }, 500);
      }
    }
  );
export default list;