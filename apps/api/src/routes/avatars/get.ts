import { createFactory } from 'hono/factory';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { and, eq } from 'drizzle-orm';
import { Avatar, avatars } from '@/db/schema/avatars';
import { AppEnv } from '@/type';
import { Hono } from 'hono';
import { AvatarRes } from '.';


const paramValidator = zValidator('param', z.object({
  id: z.uuid("ID must be a valid UUID"),
}));

const get = new Hono<AppEnv>()
  .get(
    '/',
    paramValidator,
    async (c) => {
      try {
        const userId = c.get('userId')!;
        const { id } = c.req.valid('param');
        const result = await db.select().from(avatars).where(and(
          eq(avatars.id, id),
          eq(avatars.userId, userId),
        )).limit(1);

        if (result.length === 0) {
          return c.json({ error: 'Avatar not found' }, 404);
        }
        return c.json<AvatarRes>(result[0], 200);
      } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to fetch avatar' }, 500);
      }
    }
  );
export default get;