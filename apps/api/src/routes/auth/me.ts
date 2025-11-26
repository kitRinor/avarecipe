import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { requireAuth } from '@/middleware/auth';
import { users } from '@/db/schema/users';
import { AuthUser } from '.';
import { Context, Hono } from 'hono';
import { AppEnv } from '@/type';
import { createMiddleware } from 'hono/factory';

const me = new Hono<AppEnv>()
.use(requireAuth)
.get(
  '/',
  async (c) => {
    const userId = c.get('userId');
    // Fetch latest user info from DB
    const user = await db.query.users.findFirst({ 
      where: eq(users.id, userId),
      columns: { 
        password: false, // Exclude sensitive data
        email: false 
      } 
    });

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const authUser: AuthUser = {
      id: user.id,
      displayName: user.displayName,
      handle: user.handle,
      avatarUrl: user.avatarUrl,
    };

    return c.json(authUser, 200);
  }
);
export default me;
