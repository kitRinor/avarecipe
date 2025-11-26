import { Hono } from 'hono';
import { AppEnv } from '@/type';

import upsert from './upsert';
import update from './update';
import { requireAuth } from '@/middleware/auth';

export interface CompatibilityRes {
  userId: string;
  avatarId: string;
  itemId: string;
  status: "official" | "modified" | "unsupported";
  note: string | null;
}

const app = new Hono<AppEnv>()
  .use(requireAuth)
  .route('/', upsert)
  .route('/', update); 

export default app;