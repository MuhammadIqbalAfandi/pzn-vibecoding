import type { ElysiaOpenAPIConfig } from "@elysiajs/openapi";

// Centralizes OpenAPI metadata so the app setup stays focused on wiring plugins.
export const openApiConfig = {
  path: "/swagger",
  specPath: "/swagger/json",
  provider: "swagger-ui",
  swagger: {
    persistAuthorization: true,
    displayRequestDuration: true,
  },
  documentation: {
    info: {
      title: "PZN Vibecoding API",
      version: "1.0.0",
      description:
        "Authentication backend built with Bun, ElysiaJS, Drizzle ORM, and PostgreSQL.",
    },
    tags: [
      {
        name: "App",
        description: "General application endpoints.",
      },
      {
        name: "Health",
        description: "Application and database health checks.",
      },
      {
        name: "Auth",
        description: "User registration, login, session, and logout endpoints.",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Use the bearer token returned by the login endpoint. Example: Bearer <token>",
        },
      },
    },
  },
} satisfies ElysiaOpenAPIConfig;
