import { hc } from 'hono/client';
import type { AppType } from '@repo/api'; 

const apiUrl = import.meta.env.VITE_API_URL as string || 'http://localhost:3001';
export const api = hc<AppType>(apiUrl);
