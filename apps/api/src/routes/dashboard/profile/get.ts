
import { Hono } from 'hono';
import { AppEnv } from '@/type';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { and, eq } from 'drizzle-orm';
import { profiles } from '@/db/schema/profiles';
import { ProfileRes } from '.';
import { resolvePathToUrl } from '@/lib/s3';

const get = new Hono<AppEnv>()
  .get(
    '/',
    async (c) => {
      try {
        const userId = c.get('userId')!;
        const profile = await db.select().from(profiles).where(and(
          eq(profiles.userId, userId),
        )).limit(1);

      if (profile.length === 0) {
        return c.json({ error: 'not found' }, 404);
      }

      return c.json<ProfileRes>({
        ...profile[0],
        avatarUrl: resolvePathToUrl(profile[0].avatarUrl),
      }, 200);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Failed to fetch' }, 500);
    }
  }
);
export default get;