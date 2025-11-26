
import { AppEnv } from '@/type';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { and, eq } from 'drizzle-orm';
import { _template_ } from '@/db/schema/_template_';
import { Res } from '.';



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
        const result = await db.select().from(_template_).where(and(
          eq(_template_.id, id),
          eq(_template_.userId, userId) // require ownership
        )).limit(1);
      if (result.length === 0) {
        return c.json({ error: 'not found' }, 404);
      }

      return c.json<Res>(result[0], 200);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Failed to fetch' }, 500);
    }
  }
);
export default get;