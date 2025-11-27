import { createMiddleware } from 'hono/factory';
import { verifyToken } from '../lib/auth';
import { getCookie } from 'hono/cookie';
import { BlankEnv, Env } from 'hono/types';
import { AppEnv } from '@/type';


interface AuthedEnv extends AppEnv {
  Variables: {
    userId: string;
  };
};

/**
 * トークンを検証し、c.get('userId') にユーザーIDを設定する認証ミドルウェア
 */
export const authMiddleware = createMiddleware<AppEnv>(async (c, next) => {
  // 1. Cookieからトークンを取得 (HttpOnlyなので自動でCookieから読み取る)
  const token = getCookie(c, 'auth_token');
  
  if (!token) {
    // トークンがない場合は401を返さず、userId=nullの状態で次へ (パブリックルートに対応)
    c.set('userId', null);
    console.log("No auth token found");
    await next();
    return;
  }

  try {
    // 2. JWTの検証とユーザーIDの抽出
    const payload = await verifyToken(token);
    const userId = payload.sub;
    // 3. ユーザーIDをコンテキストに設定
    if (userId) {
      c.set('userId', userId);
    } else {
      c.set('userId', null);
    }
    await next();
  } catch (e) {
    // 署名エラー、期限切れなどの場合はトークンを無視してログアウト状態として次へ
    c.set('userId', null);
    await next();
    return;
  }
});

// 認証必須のルートで使うヘルパー
export const requireAuth = createMiddleware<AuthedEnv>(async (c, next) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: 'Unauthorized: Login required' }, 401);
  }
  await next();
});

// 管理者権限が必要なルートで使うヘルパー
export const requireAdmin = createMiddleware<AuthedEnv>(async (c, next) => {
  const userId = c.get('userId');
  if (!userId) {
    return c.json({ error: 'Unauthorized: Login required' }, 401);
  }
  // ここで管理者権限のチェックを行う（例: データベースでユーザーの役割を確認）
  const isAdmin = true; // 仮の実装。実際にはDBなどで確認する。
  if (!isAdmin) {
    return c.json({ error: 'Forbidden: Admins only' }, 403);
  }
  await next();
});
