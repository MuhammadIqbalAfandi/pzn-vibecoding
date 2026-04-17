import { Elysia } from "elysia";

import { checkDatabaseConnection } from "../db/client";

export const healthRoutes = new Elysia({ prefix: "/health" })
  .get("/", () => ({
    status: "ok",
    service: "pzn-vibecoding",
    timestamp: new Date().toISOString(),
  }))
  .get("/db", async ({ set }) => {
    try {
      await checkDatabaseConnection();

      return {
        status: "ok",
        database: "reachable",
      };
    } catch (error) {
      set.status = 503;

      const message =
        error instanceof Error && error.message.trim().length > 0
          ? error.message
          : "Unable to connect to the configured database.";

      return {
        status: "error",
        database: "unreachable",
        message,
      };
    }
  });
