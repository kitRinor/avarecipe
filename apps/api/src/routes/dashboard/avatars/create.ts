import { createFactory } from 'hono/factory';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { avatars } from '@/db/schema/avatars';
import { Hono } from 'hono';
import { AppEnv } from '@/type';
import { AvatarRes } from '.';
import { genSrcKeyFromUrl } from '@/lib/sourceKeyUtil';
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
        const sourceKey = genSrcKeyFromUrl(body.storeUrl);
        if (sourceKey) {
          const existing = await db.select().from(avatars)
            .where(and(
              eq(avatars.userId,userId),
              eq(avatars.sourceKey, sourceKey)
            )).limit(1);
          if (existing.length > 0) {
            return c.json({ error: 'Avatar with the same source already exists' }, 409);
          }
        }

        const result = await db.insert(avatars).values({
          userId: userId,
          name: body.name,
          storeUrl: body.storeUrl,
          thumbnailUrl: body.thumbnailUrl,
          sourceKey: sourceKey,
        }).returning();

        return c.json<AvatarRes>(result[0], 200);
      } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to create avatar' }, 500);
      }
    }
  );
export default create;