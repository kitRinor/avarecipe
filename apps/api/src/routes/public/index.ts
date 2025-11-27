import { AppEnv } from "@/type";
import { Hono } from "hono/tiny";


const app = new Hono<AppEnv>()
  .get('/', (c) => c.text('Public Root'))

export type PublicAppType = typeof app;
export default app;
