import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { requireAuth } from '@/middleware/auth';
import { users } from '@/db/schema/users';
import { Context, Hono } from 'hono';
import { createMiddleware } from 'hono/factory';
import { AppEnv } from '@/type';

const tmp = new Hono<AppEnv>()
.use(requireAuth)
.get(
  '/',
  async (c) => {
    return c.json({ get: 'This is a temporary GET endpoint.' }, 200);
  }
)
.post(
  '/',
  async (c) => {
    return c.json({ post: 'This is a temporary POST endpoint.' }, 200);
  }
)
.put(
  '/',
  async (c) => {
    return c.json({ put: 'This is a temporary PUT endpoint.' }, 200);
  }
)
.delete(
  '/',
  async (c) => {
    return c.json({ delete: 'This is a temporary DELETE endpoint.' }, 200);
  }
);
export default tmp;
