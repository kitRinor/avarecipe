import { Hono } from 'hono';
import { AppEnv } from '@/type';

import list from './list';
import get from './get';


export interface PublicOutfitRes {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    state: "private" | "public" | "unlisted";
    user: {
      id: string;
      handle: string | null;
      displayName: string | null;
      avatarUrl: string | null;
    }
    avatar: {
      id: string;
      name: string;
      storeUrl: string | null;
      imageUrl: string | null;
    } | null;
    items: {
      id: string;
      name: string;
      storeUrl: string | null;
      category: string;
      imageUrl: string | null;
    }[];
}

const app = new Hono<AppEnv>()
  .route('/', list)
  .route('/', get)

export default app;