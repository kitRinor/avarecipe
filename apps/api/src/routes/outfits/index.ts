import { Hono } from 'hono';
import { AppEnv } from '@/type';

import list from './list';
import create from './create';
import get from './get';
import update from './update';
import del from './delete';
import getSharedByItem from './shared/getByItem';
import getSharedByAvatar from './shared/getByAvatar';


export interface OutfitRes {
    id: string;
    name: string;
    description: string | null;
    userId: string;
    avatarId: string;
    imageUrl: string | null;
    state: "private" | "public" | "unlisted";
}

const app = new Hono<AppEnv>()
  .route('shared/item', getSharedByItem)
  .route('shared/avatar', getSharedByAvatar)
  .route('/', list)
  .route('/', create)
  .route('/', get)
  .route('/', update)
  .route('/', del);

export default app;