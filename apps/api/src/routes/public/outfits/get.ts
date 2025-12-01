import { Hono } from 'hono';
import { AppEnv } from '@/type';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { db } from '@/db';
import { and, eq } from 'drizzle-orm';
import { outfits } from '@/db/schema/outfits';
import { PublicOutfitRes } from '.';
import { genUrlFromSrcKey } from '@/lib/sourceKeyUtil';

const paramValidator = zValidator('param', z.object({
  id: z.uuid("ID must be a valid UUID"),
}));

const get = new Hono<AppEnv>()
  .get(
    '/:id',
    paramValidator,
    async (c) => {
      try {
        const { id } = c.req.valid('param');
        const outfit = await db.query.outfits.findFirst({
          where: and(
            eq(outfits.id, id),
            eq(outfits.state, 'public')
          ),
          with: {
            user: {
              columns: { displayName: true, avatarUrl: true, handle: true },
            },
            avatar: {
              columns: { id: true, name: true, sourceKey: true, thumbnailUrl: true },
            },
            items: {
              with: {
                item: {
                  columns: { id: true, name: true, sourceKey: true, category: true, thumbnailUrl: true },
                }
              }
            }
          }
        });

      if (!outfit) {
        return c.json({ error: 'not found' }, 404);
      }

      const result: PublicOutfitRes = {
        id: outfit.id,
        name: outfit.name,
        description: outfit.description,
        state: outfit.state,
        imageUrl: outfit.imageUrl,
        user: {
          id: outfit.userId,
          handle: outfit.user.handle,
          displayName: outfit.user.displayName,
          avatarUrl: outfit.user.avatarUrl,
        },
        avatar: {
          id: outfit.avatar.id,
          name: outfit.avatar.name,
          storeUrl: genUrlFromSrcKey(outfit.avatar.sourceKey),
          imageUrl: outfit.avatar.thumbnailUrl,
        },
        items: outfit.items.map(oi => ({
          id: oi.item.id,
          name: oi.item.name,
          category: oi.item.category,
          storeUrl: genUrlFromSrcKey(oi.item.sourceKey),
          imageUrl: oi.item.thumbnailUrl,
        })),
      };

      return c.json<PublicOutfitRes>(result, 200);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Failed to fetch' }, 500);
    }
  }
);
export default get;