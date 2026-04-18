# Project Plan: Add Swagger UI With Auto-Generated API Docs

## Summary

Add Swagger support to this backend so every API can be tested from Swagger UI and the API documentation is generated automatically from the code.

This plan is written for a junior programmer, so the work is broken into small, safe steps.

## Goal

After this task is finished, the project should have:

- automatic OpenAPI documentation generated from the Elysia route code
- a Swagger UI page in the app
- request and response documentation for all current endpoints
- a clear way to test the APIs directly from the browser

Expected result:

- backend still runs normally
- Swagger UI is accessible from a route such as `/swagger`
- API spec is always aligned with the code as routes change

## Current Repo Context

Current stack:

- Bun
- TypeScript
- ElysiaJS
- Drizzle ORM
- PostgreSQL

Current route files:

- `src/app.ts`
- `src/routes/health.ts`
- `src/routes/user-routes.ts`

Current API endpoints already in the app:

- `GET /`
- `GET /health`
- `GET /health/db`
- `POST /api/v1/users`
- `POST /api/v1/users/login`
- `GET /api/v1/users/current`
- `POST /api/v1/users/logout`

Important current condition:

- the project does not yet expose Swagger UI
- the project does not yet describe endpoint metadata for OpenAPI generation

## Recommended Technical Approach

Use the official Elysia Swagger/OpenAPI plugin so the documentation is generated from the existing route definitions.

Recommended direction:

1. install the Elysia Swagger plugin
2. register the plugin in the app setup
3. add schema and documentation metadata to each route
4. verify the Swagger UI page opens correctly
5. verify every route appears in the generated docs

Why this approach is good:

- it fits the current Elysia architecture
- it reduces manual documentation drift
- it is simpler and safer than writing a custom OpenAPI generator

## Files Likely To Change

Main files that will probably need updates:

- `package.json`
- `src/app.ts`
- `src/routes/health.ts`
- `src/routes/user-routes.ts`
- `README.md`

Possible new files:

- none required if the plugin is configured directly in `src/app.ts`

Optional new file if the team wants cleaner organization:

- `src/config/swagger.ts`

## Step-By-Step Implementation Plan

### 1. Check Elysia Swagger plugin documentation

First, read the package documentation for the Swagger plugin that matches the current Elysia version.

Goal of this step:

- find the correct package name
- confirm installation command
- confirm how to register Swagger UI in Elysia
- confirm how to add route metadata such as tags, summary, description, body schema, headers, and responses

Output of this step:

- one short note for the team about the chosen package and how it works

### 2. Install the Swagger dependency

Add the required Swagger package to the project dependencies.

What to do:

- update dependencies in `package.json`
- run install command using Bun

Expected result:

- the project can import the Swagger plugin without TypeScript errors

### 3. Register Swagger in the app

Open `src/app.ts` and add the Swagger plugin to the Elysia app.

Suggested behavior:

- Swagger UI is exposed on a clear route such as `/swagger`
- API title, version, and description are configured

Suggested metadata:

- title: `PZN Vibecoding API`
- version: `1.0.0`
- description: short explanation of the auth API

Expected result:

- running the app should expose a Swagger UI page

### 4. Add documentation for the root endpoint

Update the `GET /` route in `src/app.ts`.

Document:

- purpose of the endpoint
- success response example

Expected result:

- the root route appears in Swagger with a readable description

### 5. Add documentation for health routes

Open `src/routes/health.ts` and add OpenAPI-friendly metadata for:

- `GET /health`
- `GET /health/db`

Document for each route:

- summary
- description
- tag, for example `Health`
- success response schema
- error response schema for `/health/db`

Important detail:

- `/health/db` can return both success and failure responses, so both should be documented

### 6. Add documentation for user register route

Open `src/routes/user-routes.ts` and document:

- `POST /api/v1/users`

Document:

- summary
- description
- tag, for example `Users` or `Auth`
- request body schema
- success response schema
- conflict response schema
- validation error note

Expected documented behavior:

- user sends `name`, `email`, and `password`
- server returns `{ "data": "ok" }` on success

### 7. Add documentation for login route

In the same file, document:

- `POST /api/v1/users/login`

Document:

- summary
- description
- request body schema
- success response containing token
- unauthorized response schema

Expected documented behavior:

- success returns `{ "token": "..." }`
- failure returns `{ "error": "email or password is wrong" }`

### 8. Add documentation for authenticated routes

Document:

- `GET /api/v1/users/current`
- `POST /api/v1/users/logout`

Important documentation details:

- both endpoints require `Authorization: Bearer <token>`
- include header/auth requirement clearly
- include success and unauthorized responses

Expected documented behavior:

- current user returns user profile data
- logout returns `{ "data": "OK" }`

### 9. Group routes with clean tags

Make the Swagger UI easier to read by using consistent tags.

Suggested tags:

- `App`
- `Health`
- `Auth`

Example grouping:

- `GET /` under `App`
- health routes under `Health`
- register, login, current, and logout under `Auth`

### 10. Add examples to improve Swagger usability

Swagger is much more useful when the request examples are easy to copy.

Add examples for:

- register request body
- login request body
- bearer token header usage
- success response bodies
- error response bodies

Goal:

- a junior developer should be able to open Swagger UI and test the API without reading service code first

### 11. Run and verify manually

Start the app and verify:

1. the app still boots correctly
2. Swagger UI page loads
3. all routes are visible
4. request schemas look correct
5. response examples look correct
6. authenticated endpoints can be tested after login

Manual checks to perform:

- open `/swagger`
- try register
- try login
- copy token from login response
- use token for current user and logout endpoints

### 12. Update README

After Swagger works, update `README.md`.

Add:

- Swagger feature in app overview
- Swagger package in the library list
- how to open Swagger UI
- how to use Swagger UI to test APIs

Expected result:

- new developers can quickly discover the documentation page

## Suggested Order Of Work

Junior programmer should do the implementation in this order:

1. read Swagger plugin docs
2. install dependency
3. register plugin in `src/app.ts`
4. document `GET /`
5. document `src/routes/health.ts`
6. document `src/routes/user-routes.ts`
7. run the app
8. verify Swagger UI manually
9. update README

## Acceptance Criteria

This task is complete when all of the following are true:

- Swagger UI is available in the running app
- OpenAPI docs are generated automatically from code
- all current endpoints appear in Swagger
- request body schemas are visible for register and login
- success and error responses are documented for major endpoints
- authenticated endpoints clearly show auth requirements
- README explains how to access Swagger UI

## Risks And Things To Watch

### 1. Plugin version mismatch

Risk:

- Swagger package may not match the current Elysia version

How to reduce risk:

- confirm compatibility before installing

### 2. Incomplete endpoint metadata

Risk:

- Swagger UI may load, but some routes may have poor or missing descriptions

How to reduce risk:

- document every route one by one
- verify the UI after each route group

### 3. Auth header not documented clearly

Risk:

- junior developers may not know how to call protected endpoints

How to reduce risk:

- add clear bearer token examples in route documentation

### 4. Docs drift in the future

Risk:

- developers add new routes without adding Swagger metadata

How to reduce risk:

- make route documentation part of the coding checklist

## Definition Of Done For Junior Programmer

Before marking the task done, confirm this checklist:

- Swagger dependency installed
- Swagger plugin registered in app
- all routes documented
- Swagger UI opens successfully
- register endpoint test works from Swagger
- login endpoint test works from Swagger
- protected endpoint test works with bearer token
- README updated
- no existing endpoint behavior is broken

## Nice-To-Have Improvements Later

These are optional and should not block the main task:

- add global API description for auth flow
- add reusable response schemas
- add reusable bearer auth scheme if supported by the chosen plugin
- add separate config file for Swagger setup if `src/app.ts` becomes crowded
