import { Hono } from 'hono';
import { AppEnv } from '@/type';
import { zValidator } from '@hono/zod-validator';
import { db } from '@/db';
import { baseQueryForGetList } from '@/lib/validator';
import { generateCondition } from '@/lib/queryUtils/filter';
import { generateSorting } from '@/lib/queryUtils/sort';
import { outfits } from '@/db/schema/outfits';
import { PublicOutfitRes } from '.';
import { and, eq } from 'drizzle-orm';


const list = new Hono<AppEnv>()
  .get(
    '/',
    zValidator('query', baseQueryForGetList(outfits, {
      sortKeys: ['id', 'createdAt'],
      filterKeys: ['id', 'createdAt'],
    })),
    async (c) => {
    try {
      const { limit, offset, sort, order, filter } = c.req.valid('query');
      
      const allAvatars = await db.query.outfits.findMany({
          where: and(
            generateCondition(outfits, filter),
            eq(outfits.state, 'public')
          ),
          with: {
            user: {
              with: {
                profile: true
              }
            },
            // Include avatar and items if needed in the future
            // avatar: {
            //   columns: { name: true, sourceKey: true, thumbnailUrl: true },
            // },
            // items: {
            //   with: {
            //     item: {
            //       columns: { name: true, sourceKey: true, category: true, thumbnailUrl: true },
            //     }
            //   }
            // }
          }
        });

        const results: PublicOutfitRes[] = allAvatars.map(outfit => ({
              id: outfit.id,
              name: outfit.name,
              description: outfit.description,
              state: outfit.state,
              imageUrl: outfit.imageUrl,
              user: {
                id: outfit.userId,
                handle: outfit.user.profile.handle,
                displayName: outfit.user.profile.displayName,
                avatarUrl: outfit.user.profile.avatarUrl,
              },
              // avatar: {
              //   name: outfit.avatar.name,
              //   sourceKey: outfit.avatar.sourceKey,
              //   imageUrl: outfit.avatar.thumbnailUrl,
              // },
              // items: outfit.items.map(oi => ({
              //   name: oi.item.name,
              //   category: oi.item.category,
              //   sourceKey: oi.item.sourceKey,
              //   imageUrl: oi.item.thumbnailUrl,
              // })),
              avatar: null,
              items: [],
            }));

      return c.json<PublicOutfitRes[]>(results, 200);
    } catch (e) {
      console.error(e);
      return c.json({ error: 'Failed to fetch' }, 500);
    }
  }
);
export default list;