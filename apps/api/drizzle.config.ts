import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// モノレポのルートにある .env を読み込む
dotenv.config();

export default {
  schema: './src/db/schema',
  
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;