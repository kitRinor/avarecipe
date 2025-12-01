import { Hono } from 'hono';
import { AppEnv } from '@/type';

import get from './get';
import update from './update';

export interface ProfileRes {
  userId: string;
  displayName: string | null;
  handle: string;
  avatarUrl: string | null;
  bio: string | null;
  // bannerUrl?: string;
  // websiteUrl?: string;
  // twitterHandle?: string;
  // discordHandle?: string;
}

const app = new Hono<AppEnv>()
  .route('/', get)
  .route('/', update)
  // 自分のprofileのみ
  // 基本的にuserに紐づいているため，create, deleteなどはしない

export default app;