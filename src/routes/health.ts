import { Elysia, t } from "elysia";

import { checkDatabaseConnection } from "../db/client";

const healthResponse = t.Object(
  {
    status: t.Literal("ok"),
    service: t.String({
      examples: ["pzn-vibecoding"],
    }),
    timestamp: t.String({
      format: "date-time",
      examples: ["2026-04-18T00:00:00.000Z"],
    }),
  },
  {
    description: "Application heartbeat response.",
  },
);

const databaseReachableResponse = t.Object(
  {
    status: t.Literal("ok"),
    database: t.Literal("reachable"),
  },
  {
    description: "Database connection check succeeded.",
  },
);

const databaseUnreachableResponse = t.Object(
  {
    status: t.Literal("error"),
    database: t.Literal("unreachable"),
    message: t.String({
      examples: ["Unable to connect to the configured database."],
    }),
  },
  {
    description: "Database connection check failed.",
  },
);

export const healthRoutes = new Elysia({ prefix: "/health" })
  .get(
    "/",
    () => ({
      status: "ok" as const,
      service: "pzn-vibecoding",
      timestamp: new Date().toISOString(),
    }),
    {
      response: {
        200: healthResponse,
      },
      detail: {
        tags: ["Health"],
        summary: "Check application health",
        description:
          "Returns a lightweight health response without touching the database.",
      },
    },
  )
  .get(
    "/db",
    async ({ set }) => {
      try {
        await checkDatabaseConnection();

        return {
          status: "ok" as const,
          database: "reachable" as const,
        };
      } catch (error) {
        set.status = 503;

        const message =
          error instanceof Error && error.message.trim().length > 0
            ? error.message
            : "Unable to connect to the configured database.";

        return {
          status: "error" as const,
          database: "unreachable" as const,
          message,
        };
      }
    },
    {
      response: {
        200: databaseReachableResponse,
        503: databaseUnreachableResponse,
      },
      detail: {
        tags: ["Health"],
        summary: "Check database health",
        description:
          "Runs a lightweight database query to confirm the configured PostgreSQL connection is reachable.",
      },
    },
  );
