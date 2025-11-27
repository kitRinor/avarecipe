
import { AppEnv } from '@/type';
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { _template_ } from '@/db/schema/_template_';
import { Res } from '.';

const paramValidator = zValidator('param', z.object({
  id: z.uuid(),
}));

const jsonValidator = zValidator('json', z.object({
  // Define your updatable fields here
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

        const result = await db.update(_template_)
          .set({
            ...body
          })
          .where(and(
            eq(_template_.id, id),
            eq(_template_.userId, userId) // require ownership
          ))
          .returning();

        if (result.length === 0) {
          return c.json({ error: 'not found' }, 404);
        }

        return c.json<Res>(result[0], 200);
      } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to update' }, 500);
      }
    }
  );
export default update;