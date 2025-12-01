import { Hono } from 'hono';
import { AppEnv } from '@/type';

import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { and, eq } from 'drizzle-orm';
import { outfits } from '@/db/schema/outfits';


const paramValidator = zValidator('param', z.object({
  id: z.uuid("ID must be a valid UUID"),
}));

const del = new Hono<AppEnv>()
  .delete(
    '/:id',
    paramValidator,
    async (c) => {
      try {
        const userId = c.get('userId')!;
        const { id } = c.req.valid('param');
        const deletedCount = await db.delete(outfits).where(and(eq(outfits.id, id), eq(outfits.userId, userId))).returning().then(res => res.length);

      if (deletedCount === 0) {
        return c.json({ error: 'not found' }, 404);
      }

      return c.json({ success: true }, 200);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Failed to delete' }, 500);
    }
  }
);
export default del;