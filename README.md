# pzn-vibecoding

`pzn-vibecoding` is a simple backend API for user authentication built with Bun, ElysiaJS, Drizzle ORM, and PostgreSQL.

This project already provides:

- health check endpoint
- database connectivity check
- user registration
- user login
- get current authenticated user
- user logout with session invalidation
- generated OpenAPI documentation with Swagger UI

## App Overview

The app is organized as a small layered backend:

- `src/index.ts` starts the HTTP server and handles graceful shutdown.
- `src/app.ts` creates the Elysia application and registers route modules.
- `src/routes/` contains HTTP endpoints and request validation.
- `src/service/` contains the main business logic for authentication.
- `src/db/` contains the database client and schema definition.
- `src/config/` contains environment configuration.
- `src/config/openapi.ts` contains Swagger/OpenAPI documentation configuration.
- `src/test/` contains API tests and shared test helpers.
- `drizzle/` stores generated SQL migrations and migration metadata.

Request flow:

1. Request enters an Elysia route.
2. Route validates request body and headers.
3. Route calls service functions in `src/service/user-service.ts`.
4. Service reads or writes data through Drizzle ORM.
5. PostgreSQL stores users and login sessions.

## Folder And File Architecture

```text
.
├── ai/
│   └── prompt-*.md           # Prompt and project notes
├── drizzle/
│   ├── 0000_steady_klaw.sql  # Initial users table migration
│   ├── 0001_faulty_polaris.sql
│   └── meta/                 # Drizzle migration metadata
├── src/
│   ├── config/
│   │   └── env.ts            # Reads and validates environment variables
│   ├── db/
│   │   ├── client.ts         # Postgres connection and Drizzle client
│   │   └── schema.ts         # Database table definitions
│   ├── routes/
│   │   ├── health.ts         # Health and DB health endpoints
│   │   └── user-routes.ts    # User/auth endpoints
│   ├── service/
│   │   └── user-service.ts   # Register, login, current user, logout logic
│   ├── test/
│   │   ├── test-utils.ts     # Test helpers and DB reset helpers
│   │   └── user-api.test.ts  # Integration-style API tests
│   ├── app.ts                # App factory
│   └── index.ts              # App entry point
├── .env.example              # Example environment variables
├── drizzle.config.ts         # Drizzle Kit config
├── package.json              # Scripts and dependencies
└── tsconfig.json             # TypeScript configuration
```

## File Naming Convention

This project mostly uses lowercase file names with kebab-case for multi-word files:

- `user-routes.ts`
- `user-service.ts`
- `user-api.test.ts`

General naming pattern used here:

- route files end with `-routes.ts`
- service files end with `-service.ts`
- test files end with `.test.ts`
- configuration files use descriptive names like `env.ts`
- database files use direct names like `client.ts` and `schema.ts`

This convention keeps each file responsibility easy to scan from the folder tree.

## Technology Stack

Main stack used in this project:

- `Bun` as runtime, package manager, and test runner
- `TypeScript` for typed application code
- `ElysiaJS` for the HTTP server and request validation
- `Drizzle ORM` for database access and typed schema
- `Drizzle Kit` for generating and running migrations
- `PostgreSQL` as the relational database
- `postgres` (`postgres.js`) as the PostgreSQL driver
- `@elysiajs/openapi` for generated OpenAPI docs and Swagger UI

## Libraries Used

Dependencies from `package.json`:

- `@elysiajs/openapi`
- `elysia`
- `drizzle-orm`
- `postgres`

Development dependencies:

- `drizzle-kit`
- `@types/bun`

Built-in Bun and Node features also used:

- `Bun.password.hash()` and `Bun.password.verify()` for password hashing
- `node:crypto` for HMAC token signing and token verification

## Environment Configuration

Example environment variables are provided in `.env.example`:

```env
NODE_ENV=development
APP_HOST=0.0.0.0
APP_PORT=3000
DATABASE_URL=postgres://postgres:postgres@localhost:5432/pzn_vibecoding
AUTH_TOKEN_SECRET=development-secret-change-me
```

Explanation:

- `NODE_ENV`: app environment, default is `development`
- `APP_HOST`: host used by the Bun server
- `APP_PORT`: port used by the Bun server
- `DATABASE_URL`: PostgreSQL connection string
- `AUTH_TOKEN_SECRET`: secret key used to sign auth tokens

`DATABASE_URL` is required. The app will fail to start if it is missing.

## Database Schema

Database schema is defined in [src/db/schema.ts](/home/iqbal/Documents/Code/vibecoding/pzn-vibecoding/src/db/schema.ts).

### `users` table

Stores registered users.

| Column | Type | Description |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `name` | `varchar(255)` | User full name |
| `email` | `varchar(255)` | Unique user email |
| `password` | `varchar(255)` | Hashed password |
| `created_at` | `timestamp with time zone` | Creation time |
| `updated_at` | `timestamp with time zone` | Last update time |

Rules:

- `email` must be unique
- password stored in database is hashed, not plain text

### `sessions` table

Stores active login sessions.

| Column | Type | Description |
| --- | --- | --- |
| `id` | `uuid` | Primary key |
| `user_id` | `uuid` | References `users.id` |
| `token` | `text` | Unique signed auth token |
| `expires_at` | `timestamp with time zone` | Token expiry time |
| `created_at` | `timestamp with time zone` | Session creation time |

Rules:

- `user_id` has foreign key relation to `users.id`
- deleting a user will also delete related sessions with `ON DELETE CASCADE`
- `token` must be unique

### Database Relationship

```text
users (1) ----< sessions (many)
```

One user can have multiple sessions.

## API Documentation

All API routes currently available:

### `GET /`

Basic startup endpoint.

Response:

```json
{
  "message": "PZN Vibecoding backend is running."
}
```

### `GET /health`

Application health check.

Response:

```json
{
  "status": "ok",
  "service": "pzn-vibecoding",
  "timestamp": "2026-04-18T00:00:00.000Z"
}
```

### `GET /health/db`

Checks database connectivity.

Success response:

```json
{
  "status": "ok",
  "database": "reachable"
}
```

Failure response:

```json
{
  "status": "error",
  "database": "unreachable",
  "message": "Unable to connect to the configured database."
}
```

### `POST /api/v1/users`

Register a new user.

Request body:

```json
{
  "name": "Test User",
  "email": "test@example.com",
  "password": "password123"
}
```

Success response:

```json
{
  "data": "ok"
}
```

Possible errors:

- `409` if email already exists
- `422` if request body validation fails

### `POST /api/v1/users/login`

Login using email and password.

Request body:

```json
{
  "email": "test@example.com",
  "password": "password123"
}
```

Success response:

```json
{
  "token": "jwt-like-token"
}
```

Possible errors:

- `401` if email or password is invalid
- `422` if request body validation fails

### `GET /api/v1/users/current`

Get the currently authenticated user.

Request header:

```http
Authorization: Bearer <token>
```

Success response:

```json
{
  "data": {
    "id": "uuid",
    "name": "Test User",
    "email": "test@example.com",
    "created_at": "2026-04-18T00:00:00.000Z"
  }
}
```

Possible errors:

- `401` if token is missing, invalid, expired, or not found in `sessions`

### `POST /api/v1/users/logout`

Logout the current user and remove the session from database.

Request header:

```http
Authorization: Bearer <token>
```

Success response:

```json
{
  "data": "OK"
}
```

Possible errors:

- `401` if token is missing, invalid, expired, or already logged out

## Swagger / OpenAPI

This project now exposes generated API documentation from the Elysia route schemas.

Documentation endpoints:

- `GET /swagger` for the Swagger UI page
- `GET /swagger/json` for the generated OpenAPI JSON document

Swagger/OpenAPI details:

- docs are generated automatically from route `body`, `response`, and `detail` metadata
- protected endpoints are marked with bearer authentication requirements
- request and response examples are included for the auth endpoints

How to use it:

1. Start the app with `bun run dev` or `bun run start`.
2. Open `http://localhost:3000/swagger`.
3. Register or log in through the docs UI.
4. Copy the returned token.
5. Use the `Authorize` button or the bearer auth input for protected endpoints.

## Authentication Implementation

Authentication in this project works like this:

1. User registers with name, email, and password.
2. Password is hashed using Bun password hashing with bcrypt.
3. User logs in with email and password.
4. App creates an HMAC-signed token using `AUTH_TOKEN_SECRET`.
5. Token is stored in the `sessions` table with expiry time.
6. Protected endpoints validate both the token signature and session record in database.
7. Logout deletes the token from `sessions`.

Important note:

- the token format is JWT-like and manually signed with `HS256`
- it is not using an external JWT library
- session validity depends on both token integrity and a matching database row

## Setup Project

### 1. Install Bun

Make sure Bun is installed on your machine.

Check:

```bash
bun --version
```

### 2. Install dependencies

```bash
bun install
```

### 3. Prepare environment file

```bash
cp .env.example .env
```

Then adjust `DATABASE_URL` and `AUTH_TOKEN_SECRET` for your local environment.

### 4. Prepare PostgreSQL database

Create a PostgreSQL database, for example:

- database name: `pzn_vibecoding`
- username: `postgres`
- password: `postgres`

### 5. Run migrations

```bash
bun run db:migrate
```

If you change the Drizzle schema and want to generate a new migration first:

```bash
bun run db:generate
```

## How To Run The App

Run in development mode with watch:

```bash
bun run dev
```

Run without watch:

```bash
bun run start
```

By default the server runs at:

```text
http://localhost:3000
```

If `APP_HOST=0.0.0.0`, you can also access it from your local network depending on your environment.

Swagger UI is available at:

```text
http://localhost:3000/swagger
```

## Testing

This project includes automated tests for the authentication API and supports manual API testing with `curl`.

This project already has automated API tests in [src/test/user-api.test.ts](/home/iqbal/Documents/Code/vibecoding/pzn-vibecoding/src/test/user-api.test.ts).

The tests use helpers from [src/test/test-utils.ts](/home/iqbal/Documents/Code/vibecoding/pzn-vibecoding/src/test/test-utils.ts) and call the Elysia app directly without starting the HTTP server on a real port.

### Before running tests

Make sure these requirements are ready:

- Bun is installed
- PostgreSQL is running
- `.env` exists
- `DATABASE_URL` points to a valid database
- database migrations have already been applied

Recommended preparation flow:

```bash
cp .env.example .env
bun install
bun run db:migrate
```

### Automated Tests

```bash
bun test
```

### How Automated Tests Work

The test suite is closer to integration testing than pure unit testing:

- tests create requests with `app.handle(...)`
- route validation, service logic, and database queries all run together
- the same Drizzle client from `src/db/client.ts` is used in tests
- test cleanup removes records from `sessions` and `users` before each test

Because of this, the database must be reachable when tests run.

### Test Coverage

- user registration success and validation errors
- duplicate email handling
- login success and invalid credentials
- current user endpoint authorization behavior
- logout behavior and session deletion

More specifically, the existing tests verify:

- successful registration with valid input
- duplicate email returns `409`
- invalid email, short password, and empty name return validation errors
- successful login returns a token and creates a session row
- invalid login returns `401`
- `GET /api/v1/users/current` returns the logged-in user for a valid token
- missing, malformed, deleted, or logged-out tokens return `401`
- logout deletes the stored session token

### Test Database Behavior

Important details:

- tests use the real database client from `src/db/client.ts`
- because of that, your configured database must be available before running tests
- test helpers clean data by deleting rows from `sessions` and `users`

If you want safer isolation, you can point `DATABASE_URL` to a dedicated test database instead of your development database.

### Type Checking

To check TypeScript types without running tests:

```bash
bun run check
```

### Example Test Workflow

```bash
cp .env.example .env
bun install
bun run db:migrate
bun test
bun run check
```

### Manual API Testing

Register user:

```bash
curl -X POST http://localhost:3000/api/v1/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

Login:

```bash
curl -X POST http://localhost:3000/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Get current user:

```bash
curl http://localhost:3000/api/v1/users/current \
  -H "Authorization: Bearer <token>"
```

Logout:

```bash
curl -X POST http://localhost:3000/api/v1/users/logout \
  -H "Authorization: Bearer <token>"
```

## Useful Commands

```bash
bun run dev
bun run start
bun test
bun run check
bun run db:generate
bun run db:migrate
bun run db:studio
```

## Notes

- `src/config/env.ts` validates required environment values when the app starts.
- `drizzle.config.ts` also requires `DATABASE_URL` for migration commands.
- `updated_at` exists on the `users` table, but there is currently no update-user endpoint yet.
- the project is small and straightforward, so route and service separation is enough without adding controller or repository layers yet.
