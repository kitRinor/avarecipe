import { Hono } from 'hono';
import { AppEnv } from '@/type';

import list from './list';
import create from './create';
import get from './get';
import update from './update';
import del from './delete';

export interface ItemRes {
  id: string;
  userId: string;
  name: string;
  sourceKey: string | null;
  category: "cloth" | "hair" | "accessory" | "texture" | "prop" | "gimmick" | "other";
  storeUrl: string | null;
  thumbnailUrl: string | null;
  createdAt: Date | null;
}

const app = new Hono<AppEnv>()
  .route('/', list)
  .route('/', create)
  .route('/', get)
  .route('/', update)
  .route('/', del);

export default app;