# pzn-vibecoding

Backend starter built with Bun, ElysiaJS, Drizzle, and Postgres.

## Stack

- Bun for runtime and package management
- ElysiaJS for the HTTP server
- Drizzle ORM and Drizzle Kit for schema and migrations
- Postgres via `postgres.js`

## Project Structure

```text
src/
  app.ts
  config/
  db/
  routes/
```

## Getting Started

1. Install Bun if it is not already available.
2. Install dependencies:

```bash
bun install
```

3. Create your environment file:

```bash
cp .env.example .env
```

4. Update `DATABASE_URL` so it points at your local Postgres instance.

## Development

Run the API in watch mode:

```bash
bun run dev
```

The server starts on `http://localhost:3000` by default.

## Available Routes

- `GET /` simple startup confirmation
- `GET /health` application health check
- `GET /health/db` database connectivity check
- `POST /api/v1/users` register a user
- `POST /api/v1/users/login` log in a user

## Database Commands

Generate migrations from the schema:

```bash
bun run db:generate
```

Apply migrations:

```bash
bun run db:migrate
```

Open Drizzle Studio:

```bash
bun run db:studio
```

## Notes

- Environment settings live in `.env`.
- Set `AUTH_TOKEN_SECRET` in `.env` so login tokens are signed with your own secret.
- The baseline schema now includes a `users` table for registration and login.
- `drizzle.config.ts` reads `DATABASE_URL` from the environment, so make sure it is set before running Drizzle commands.
