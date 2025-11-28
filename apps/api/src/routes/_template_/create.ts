import { createFactory } from 'hono/factory';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { _template_ } from '@/db/schema/_template_';
import { Hono } from 'hono';
import { AppEnv } from '@/type';
import { Res } from '.';

const jsonValidator = zValidator('json', z.object({
  userId: z.uuid("User ID must be a valid UUID"),
  // Add other necessary fields here
}));

const create = new Hono<AppEnv>()
.post(
  '/',
  jsonValidator,
  async (c) => {
    try {
      const userId = c.get('userId')!;
      const body = c.req.valid('json');

      const result = await db.insert(_template_).values({
        ...body,
        userId: userId, // ensure the userId is set from the authenticated user
      }).returning();

      return c.json<Res>(result[0], 200);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Failed to create' }, 500);
    }
  }
);

export default create;