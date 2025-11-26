import { Hono } from 'hono';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';

const allowedRemoteRegexp = [
  // https://booth.pm/xx/items/0000000(.json)
  /^https:\/\/(?:[\w-]+\.)?booth\.pm\/(?:\w+\/)?items\/\d+(?:\.json)?$/,
  // https://*.booth.pm/items/0000000(.json)
  /^https:\/\/(?:[\w-]+\.)?booth\.pm\/(?:\w+\/)?items\/\d+(?:\.json)?$/,
];

const app = new Hono()
  .get(
    '/', 
    zValidator('query', z.object({ url: z.url() })), 
    async (c) => {
      const { url } = c.req.valid('query');
      // URLが許可されたドメイン・パスかチェック
      const isAllowed = allowedRemoteRegexp.some((regexp) => regexp.test(url));
      if (!isAllowed) {
        return c.text('requested URL not allowed', 400);
      }

      try {
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; VRClo/1.0)',
            'Accept-Language': 'ja-JP',
          }
        });

        if (!res.ok) {
          return c.text(`Failed to fetch by code ${res.status} : ${url}`, 400);
        }
        // レスポンスがJsonなら，c.json, そうでなければテキストで返す
        const contentType = res.headers.get('Content-Type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          return c.json(data);
        } else {
          const text = await res.text();
          return c.text(text);
        }
      } catch (e) {
        return c.text('Error fetching URL', 500);
      }
    }
  );

export default app;