import { Context, Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { db } from '@/db';
import { eq, and, desc, exists } from 'drizzle-orm';
import { AppEnv } from '@/type';
import { outfitItems, outfits, outfitStateEnum } from '@/db/schema/outfits';
import { resolveS3Url } from '@/lib/s3';
import { avatars } from '@/db/schema/avatars';


interface SharedOutfitByAvatarRes {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  userDisplayName: string | null;
  imageUrl: string | null;
  // avatarStoreUrl: string | null;
  // itemStoreUrls: (string | null)[];
}


// Validation Schema
const paramValidator = zValidator('param', z.object({
  id: z.uuid(),
}))

const getSharedByAvatar = new Hono<AppEnv>()
  .get('/:id', 
    paramValidator,
    async (c) => {
      try {
        const userId = c.get('userId')!;
        // Cast param validation result since c.req.valid typing can be complex in RPC
        const { id } = c.req.valid('param' as any);

        // 1. Get the target avatar's sourceId
        const targetAvatar = await db.query.avatars.findFirst({
          where:and(eq(avatars.id, id), eq(avatars.userId, userId)),
          columns: { sourceKey: true },
        });

        if (!targetAvatar) {
          console.log('Avatar not found:', id);
          return c.json({ error: 'not found' }, 404);
        }
        // If the avatar has no sourceId (e.g. not a BOOTH avatar), we cannot find shared outfits by source
        if (!targetAvatar.sourceKey) {
          console.log('Avatar not found or has no sourceKey:', id);
          return c.json([], 200);
        }

        // 2. Find public outfits containing items with the same sourceId
        const sharedOutfits = await db.query.outfits.findMany({
          where: (outfit) => and(
            // Filter by state 'public' instead of isPublic boolean
            eq(outfit.state, 'public'),
            // Subquery: Check if the outfit uses the same avatar sourceId
            exists(
              db.select()
                .from(avatars)
                .where(and(
                  eq(avatars.id, outfit.avatarId),
                  eq(avatars.sourceKey, targetAvatar.sourceKey!),
                ))
            ),
          ),
          // Only select necessary columns
          columns: {
            id: true,
            name: true,
            description: true,
            userId: true,
            imageUrl: true,
          },
          with: {
            user: {
              with: {
                profile: {
                  columns: { displayName: true },
                },
              },
            },
          },
          orderBy: desc(outfits.createdAt),
          limit: 20,
        });

        // 3. Format response
        const response: SharedOutfitByAvatarRes[] = sharedOutfits.map((outfit) => ({
          id: outfit.id,
          name: outfit.name,
          description: outfit.description,
          userId: outfit.userId,
          userDisplayName: outfit.user.profile.displayName,
          imageUrl: resolveS3Url(outfit.imageUrl),
        }));

        return c.json(response, 200);

      } catch (e) {
        console.error(e);
        return c.json({ error: 'Failed to fetch shared outfits' }, 500);
      }
    }
  );
export default getSharedByAvatar;