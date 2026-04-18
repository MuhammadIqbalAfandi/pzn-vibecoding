import { Elysia } from "elysia";

import { healthRoutes } from "./routes/health";
import { userRoutes } from "./routes/user-routes";

export function createApp() {
  return new Elysia()
    .get("/", () => ({
      message: "PZN Vibecoding backend is running.",
    }))
    .use(healthRoutes)
    .use(userRoutes);
}
