
import { Hono } from 'hono';
import { AppEnv } from '@/type';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { and, eq, ne } from 'drizzle-orm';
import { db } from '@/db';
import { items } from '@/db/schema/items';
import { ItemRes } from '.';
import { generateSourceKey } from '@/lib/sourceKeyUtil';


const paramValidator = zValidator('param', z.object({
  id: z.uuid(),
}));

const jsonValidator = zValidator('json', z.object({
  name: z.string().min(1, "Name is required"),
    storeUrl: z.url().or(z.string().startsWith("/")).or(z.literal("")).nullable(),
    thumbnailUrl: z.url().or(z.string().startsWith("/")).or(z.literal("")).nullable(),
}).partial());

const update = new Hono<AppEnv>()
  .put(
    '/:id', 
    paramValidator,
    jsonValidator,
    async (c) => {
      try {
        const userId = c.get('userId')!;
        const { id } = c.req.valid('param');
        const body = c.req.valid('json');

        // Check for duplicate sourceKey if storeUrl is being updated
        const sourceKey = body.storeUrl !== undefined ? generateSourceKey(body.storeUrl) : null;
        if (sourceKey) {
          const existing = await db.select().from(items)
            .where(and(
              ne(items.id, id),
              eq(items.userId,userId),
              eq(items.sourceKey, sourceKey)
            )).limit(1);
          if (existing.length > 0) {
            return c.json({ error: 'Item with the same source already exists' }, 409);
          }
        }

        const result = await db.update(items)
          .set({
            name: body.name,
            storeUrl: body.storeUrl,
            thumbnailUrl: body.thumbnailUrl,
            sourceKey: sourceKey,
          })
          .where(and(
            eq(items.id, id),
            eq(items.userId, userId),
          ))
          .returning();

        if (result.length === 0) {
          return c.json({ error: 'not found' }, 404);
        }

        return c.json<ItemRes>(result[0], 200);
      } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to update' }, 500);
      }
    }
  );
export default update;