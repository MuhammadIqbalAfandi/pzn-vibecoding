const requiredVariables = ["DATABASE_URL"] as const;

type RequiredVariable = (typeof requiredVariables)[number];

// Reads a required environment variable and throws early when it is missing.
function requireEnv(name: RequiredVariable): string {
  const value = Bun.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

// Parses the configured port and falls back to a default when it is not set.
function readPort(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`APP_PORT must be a positive integer. Received: ${value}`);
  }

  return parsed;
}

export const env = {
  nodeEnv: Bun.env.NODE_ENV ?? "development",
  host: Bun.env.APP_HOST ?? "0.0.0.0",
  port: readPort(Bun.env.APP_PORT, 3000),
  databaseUrl: requireEnv("DATABASE_URL"),
  authTokenSecret: Bun.env.AUTH_TOKEN_SECRET ?? "development-secret-change-me",
} as const;
