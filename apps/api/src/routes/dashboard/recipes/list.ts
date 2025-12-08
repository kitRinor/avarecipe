import { zValidator } from '@hono/zod-validator';
import { AppEnv } from '@/type';
import { Hono } from 'hono';
import { baseQueryForGetList } from '@/lib/validator';
import { generateCondition } from '@/lib/queryUtils/filter';
import { generateSorting } from '@/lib/queryUtils/sort';
import { db } from '@/db';
import { RecipeRes } from '.';
import { recipes } from '@/db/schema/recipes';
import { assets } from '@/db/schema/assets'; // 👈 Import assets
import { eq } from 'drizzle-orm';
import { resolvePathToUrl } from '@/lib/s3';

const list = new Hono<AppEnv>()
  .get(
    '/',
    zValidator('query', baseQueryForGetList(recipes, {
      sortKeys: ['id', 'createdAt'],
      filterKeys: ['id', 'createdAt', 'name'],
    })),
    async (c) => {
      try {
        const userId = c.get('userId')!;
        const { limit, offset, sort, order, filter } = c.req.valid('query');
        
        const result = await db.select()
          .from(recipes)
          // 👇 Join with assets table to get baseAsset info
          .leftJoin(assets, eq(recipes.baseAssetId, assets.id))
          .where(generateCondition(recipes, filter, userId))
          .orderBy(generateSorting(recipes, order, sort))
          .limit(limit)
          .offset(offset);

        // Map the joined result
        const response: RecipeRes[] = result.map(({ recipes: r, assets: ba }) => ({
          ...r,
          imageUrl: resolvePathToUrl(r.imageUrl),
          createdAt: r.createdAt ? new Date(r.createdAt) : null,
          updatedAt: r.updatedAt ? new Date(r.updatedAt) : null,
          // 👇 Populate baseAsset from joined data
          baseAsset: ba ? {
            name: ba.name,
            storeUrl: ba.storeUrl,
            imageUrl: resolvePathToUrl(ba.imageUrl),
            category: ba.category,
          } : null,
          // Empty for list view
          steps: [],
          assets: [],
        }));

        return c.json(response, 200);
      } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to fetch' }, 500);
      }
    }
  );

export default list;