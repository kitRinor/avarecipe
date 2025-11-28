
import { Hono } from 'hono';
import { AppEnv } from '@/type';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { items } from '@/db/schema/items';
import { ItemRes } from '.';
import { generateSourceKey } from '@/lib/sourceKeyUtil';
import { and, eq } from 'drizzle-orm';

const jsonValidator = zValidator('json', z.object({
  name: z.string().min(1, "Name is required"),
  storeUrl: z.url().or(z.string().startsWith("/")).or(z.literal("")).nullable(),
  thumbnailUrl: z.url().or(z.string().startsWith("/")).or(z.literal("")).nullable(),
}));

const create = new Hono<AppEnv>()
  .post(
    '/',
    jsonValidator,
    async (c) => {
      try {
        const userId = c.get('userId')!;
        const body = c.req.valid('json');

        // Generate a unique source key and check for duplicates
        const sourceKey = generateSourceKey(body.storeUrl);
        if (sourceKey) {
          const existing = await db.select().from(items)
            .where(and(
              eq(items.userId,userId),
              eq(items.sourceKey, sourceKey)
            )).limit(1);
          if (existing.length > 0) {
            return c.json({ error: 'Item with the same source already exists' }, 409);
          }
        }

        const result = await db.insert(items).values({
          name: body.name,
          userId: userId,
          storeUrl: body.storeUrl,
          thumbnailUrl: body.thumbnailUrl,
          sourceKey: sourceKey,
        }).returning();

        return c.json<ItemRes>(result[0], 200);
      } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to create' }, 500);
      }
    }
  );
export default create;