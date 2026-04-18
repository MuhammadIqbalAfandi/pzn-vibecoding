import { openapi } from "@elysiajs/openapi";
import { Elysia, t } from "elysia";

import { openApiConfig } from "./config/openapi";
import { healthRoutes } from "./routes/health";
import { userRoutes } from "./routes/user-routes";

const rootResponse = t.Object(
  {
    message: t.String({
      examples: ["PZN Vibecoding backend is running."],
    }),
  },
  {
    description: "Startup confirmation response for the API root endpoint.",
  },
);

// Builds the Elysia application and wires all route modules together.
export function createApp() {
  return new Elysia()
    .use(openapi(openApiConfig))
    .get(
      "/",
      () => ({
        message: "PZN Vibecoding backend is running.",
      }),
      {
        response: {
          200: rootResponse,
        },
        detail: {
          tags: ["App"],
          summary: "Show API startup status",
          description:
            "Returns a simple confirmation message that the backend process is running.",
        },
      },
    )
    .use(healthRoutes)
    .use(userRoutes);
}
