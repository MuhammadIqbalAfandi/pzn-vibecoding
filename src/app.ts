import { Elysia } from "elysia";

import { healthRoutes } from "./routes/health";

export function createApp() {
  return new Elysia()
    .get("/", () => ({
      message: "PZN Vibecoding backend is running.",
    }))
    .use(healthRoutes);
}
