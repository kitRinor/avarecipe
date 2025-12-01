import { Hono } from 'hono';
import { AppEnv } from '@/type';

import list from './list';
import create from './create';
import get from './get';
import update from './update';
import del from './delete';
import { requireAuth } from '@/middleware/auth';

export interface AvatarRes {
  id: string;
  userId: string;
  name: string;
  sourceKey: string | null;
  storeUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: Date | null;
}

const app = new Hono<AppEnv>()
  .use(requireAuth)
  .route('/', list)
  .route('/', create)
  .route('/:id', get)
  .route('/:id', update)
  .route('/:id', del);

export default app;