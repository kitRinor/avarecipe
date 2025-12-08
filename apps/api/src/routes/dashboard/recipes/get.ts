
import { AppEnv } from '@/type';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { and, asc, eq } from 'drizzle-orm';
import { RecipeRes } from '.';
import { recipeAssets, recipes, recipeSteps } from '@/db/schema/recipes';
import { assets } from '@/db/schema/assets';
import { resolvePathToUrl } from '@/lib/s3';



const paramValidator = zValidator('param', z.object({
  id: z.uuid("ID must be a valid UUID"),
}));

const get = new Hono<AppEnv>()
  .get(
    '/:id',
    paramValidator,
    async (c) => {
      try {
        const userId = c.get('userId')!;
        const { id } = c.req.valid('param');
        const result = await db.select().from(recipes).where(and(
          eq(recipes.id, id),
          eq(recipes.userId, userId) // require ownership
        )).limit(1);
      if (result.length === 0) {
        return c.json({ error: 'not found' }, 404);
      }
      // get steps and assets
      const recipeId = result[0].id;
      const [baseAsset] = result[0].baseAssetId ? await db.select().from(assets).where(eq(assets.id, result[0].baseAssetId)).limit(1) : [null];
      const rSteps = await db.query.recipeSteps.findMany({
        where: eq(recipeSteps.recipeId, recipeId),
        orderBy: asc(recipeSteps.stepNumber),
      });
      const rAssets =  await db.query.recipeAssets.findMany({
        where: eq(recipeAssets.recipeId, recipeId),
        with: {
          asset: true,
        },
      });

      return c.json<RecipeRes>({
        ...result[0],
        imageUrl: resolvePathToUrl(result[0].imageUrl),
        baseAsset: baseAsset,
        steps: rSteps,
        assets: rAssets,
      }, 200);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Failed to fetch' }, 500);
    }
  }
);
export default get;