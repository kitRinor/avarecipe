import { requireAdmin } from "@/middleware/auth";
import { AppEnv } from "@/type";
import { Hono } from "hono/tiny";


const app = new Hono<AppEnv>()
  .use(requireAdmin) // need authentication for all routes
  .get('/', (c) => c.text('Dashboard Root'))

export type AdminAppType = typeof app;
export default app;
