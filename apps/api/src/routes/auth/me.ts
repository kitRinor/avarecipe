import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { requireAuth } from '@/middleware/auth';
import { users } from '@/db/schema/users';
import { AuthUser } from '.';
import { Context, Hono } from 'hono';
import { AppEnv } from '@/type';
import { createMiddleware } from 'hono/factory';
import { profiles } from '@/db/schema/profiles';
import { resolvePathToUrl } from '@/lib/s3';

const me = new Hono<AppEnv>()
.use(requireAuth)
.get(
  '/',
  async (c) => {
    const userId = c.get('userId')!;
    // Fetch latest userProfile info from DB
    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
    });

    if (!profile) {
      return c.json({ error: 'User not found' }, 404);
    }

    const authUser: AuthUser = {
      id: profile.userId,
      displayName: profile.displayName,
      handle: profile.handle,
      avatarUrl: resolvePathToUrl(profile.avatarUrl),
    };

    return c.json(authUser, 200);
  }
);
export default me;
