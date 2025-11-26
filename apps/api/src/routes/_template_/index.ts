import { Hono } from 'hono';
import { AppEnv } from '@/type';

import list from './list';
import get from './get';
import create from './create';
import update from './update';
import del from './delete';
import { requireAuth } from '@/middleware/auth';

// Define the response interface for type safety
export interface Res {
  id: string;
  userId: string;
  createdAt: Date | null;
  // add other fields here
}

const app = new Hono<AppEnv>()
  .use(requireAuth)
  .route('/', list)
  .route('/', create)
  .route('/', get)
  .route('/', update)
  .route('/', del);

export default app;