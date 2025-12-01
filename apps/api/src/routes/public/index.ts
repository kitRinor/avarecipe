import { AppEnv } from "@/type";
import { Hono } from "hono/tiny";

import publicOutfitRoutes from "./outfits/index.js";

const app = new Hono<AppEnv>()
  .route('/outfits', publicOutfitRoutes);

export default app;
