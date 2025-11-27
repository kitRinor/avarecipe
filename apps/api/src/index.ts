import { serve } from '@hono/node-server';
import { Hono } from 'hono';
// import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { authMiddleware } from './middleware/auth';

// Import sub-apps
import authRoute from './routes/auth';
import adminRoute from './routes/admin';
import dashboardRoute from './routes/dashboard';
import publicRoute from './routes/public';

import { config } from 'dotenv';
import { AppEnv } from './type';
config();


const app = new Hono<AppEnv>();

// Global Middleware
// Allow CORS for Frontend
app.use('/*', cors({
  origin: process.env.WEB_ORIGIN_URL || 'http://localhost:5173',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type'],
  credentials: true, // Cookieを許可
}));

// Apply auth middleware globally
app.use('/*', authMiddleware);

// Mount routes
const routes = app
  .route('/auth', authRoute) // 認証関連
  .route('/admin', adminRoute) // 管理コンソール用(認証必須)
  .route('/dashboard', dashboardRoute) // ダッシュボード用(認証必須)
  .route('/public', publicRoute) // 公開ページ用

export type AppType = typeof routes;

const port = Number(process.env.API_PORT) || 8787;
console.log(`Server is running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});



