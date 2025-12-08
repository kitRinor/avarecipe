
import { Hono } from 'hono';
import { AppEnv } from '@/type';
import { zValidator } from '@hono/zod-validator';
import { db } from '@/db';
import { baseQueryForGetList } from '@/lib/validator';
import { generateCondition } from '@/lib/queryUtils/filter';
import { generateSorting } from '@/lib/queryUtils/sort';
import { assets } from '@/db/schema/assets';
import { AssetRes } from '.';
import { resolvePathToUrl } from '@/lib/s3';


const list = new Hono<AppEnv>()
  .get(
    '/', 
    zValidator('query', baseQueryForGetList(assets, {
      sortKeys: ['id', 'createdAt'],
      filterKeys: ['id', 'name', 'createdAt'],
    })),
    async (c) => {
      try {
        const userId = c.get('userId')!;
        const { limit, offset, sort, order, filter } = c.req.valid('query');
        
        const allAssets = await db.select().from(assets)
          .where(generateCondition(assets, filter, userId))
          .orderBy(generateSorting(assets, order, sort))
          .limit(limit)
          .offset(offset);

        return c.json<AssetRes[]>(allAssets.map(a => ({
          ...a,
          imageUrl: resolvePathToUrl(a.imageUrl),
        })), 200);
      } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to fetch' }, 500);
      }
    }
  );
export default list;