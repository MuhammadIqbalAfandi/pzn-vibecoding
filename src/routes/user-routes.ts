import { Elysia, t } from "elysia";

import {
  UnauthorizedError,
  InvalidCredentialsError,
  UserConflictError,
  getCurrentUser,
  loginUser,
  logoutUser,
  registerUser,
} from "../service/user-service";

const registerBody = t.Object(
  {
    name: t.String({
      minLength: 1,
      maxLength: 255,
      description: "Display name for the new user account.",
      examples: ["Test User"],
    }),
    email: t.String({
      format: "email",
      maxLength: 255,
      description: "Unique email address used to log in.",
      examples: ["test@example.com"],
    }),
    password: t.String({
      minLength: 8,
      maxLength: 255,
      description: "Plain text password before hashing.",
      examples: ["password123"],
    }),
  },
  {
    description: "Payload used to register a new user account.",
    examples: [
      {
        name: "Test User",
        email: "test@example.com",
        password: "password123",
      },
    ],
  },
);

const loginBody = t.Object(
  {
    email: t.String({
      format: "email",
      maxLength: 255,
      description: "Registered email address.",
      examples: ["test@example.com"],
    }),
    password: t.String({
      minLength: 8,
      maxLength: 255,
      description: "Plain text password for the user account.",
      examples: ["password123"],
    }),
  },
  {
    description: "Payload used to log in and create a new session.",
    examples: [
      {
        email: "test@example.com",
        password: "password123",
      },
    ],
  },
);

const registerSuccessResponse = t.Object(
  {
    data: t.Literal("ok"),
  },
  {
    description: "User registration completed successfully.",
  },
);

const loginSuccessResponse = t.Object(
  {
    token: t.String({
      description: "Signed bearer token for authenticated requests.",
      examples: ["eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature"],
    }),
  },
  {
    description: "Login succeeded and a session token was issued.",
  },
);

const currentUserResponse = t.Object(
  {
    data: t.Object({
      id: t.String({
        format: "uuid",
        examples: ["3f32f625-9b6c-4b78-b48b-6786a5b3bf5f"],
      }),
      name: t.String({
        examples: ["Test User"],
      }),
      email: t.String({
        format: "email",
        examples: ["test@example.com"],
      }),
      created_at: t.String({
        format: "date-time",
        examples: ["2026-04-18T00:00:00.000Z"],
      }),
    }),
  },
  {
    description: "Current authenticated user profile.",
  },
);

const logoutSuccessResponse = t.Object(
  {
    data: t.Literal("OK"),
  },
  {
    description: "Session was invalidated successfully.",
  },
);

const unauthorizedResponse = t.Object(
  {
    error: t.String({
      examples: ["Unauthorized"],
    }),
  },
  {
    description: "Missing, invalid, expired, or logged-out bearer token.",
  },
);

const invalidCredentialsResponse = t.Object(
  {
    error: t.String({
      examples: ["email or password is wrong"],
    }),
  },
  {
    description: "Email address or password did not match an existing user.",
  },
);

const userConflictResponse = t.Object(
  {
    error: t.String({
      examples: ["email is already taken"],
    }),
  },
  {
    description: "A user with the same email address already exists.",
  },
);

// Extracts a bearer token from the Authorization header or throws when invalid.
function getBearerToken(authorization: string | undefined): string {
  if (!authorization?.startsWith("Bearer ")) {
    throw new UnauthorizedError();
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    throw new UnauthorizedError();
  }

  return token;
}

export const userRoutes = new Elysia({ prefix: "/api/v1/users" })
  .post(
    "/",
    async ({ body, set }) => {
      try {
        return await registerUser(body);
      } catch (error) {
        if (error instanceof UserConflictError) {
          set.status = 409;
          return { error: error.message };
        }

        throw error;
      }
    },
    {
      body: registerBody,
      response: {
        200: registerSuccessResponse,
        409: userConflictResponse,
      },
      detail: {
        tags: ["Auth"],
        summary: "Register a new user",
        description:
          "Creates a new user account with a unique email address and a bcrypt-hashed password.",
      },
    },
  )
  .post(
    "/login",
    async ({ body, set }) => {
      try {
        return await loginUser(body);
      } catch (error) {
        if (error instanceof InvalidCredentialsError) {
          set.status = 401;
          return { error: error.message };
        }

        throw error;
      }
    },
    {
      body: loginBody,
      response: {
        200: loginSuccessResponse,
        401: invalidCredentialsResponse,
      },
      detail: {
        tags: ["Auth"],
        summary: "Log in a user",
        description:
          "Authenticates a registered user and issues a signed bearer token stored in the sessions table.",
      },
    },
  )
  .get(
    "/current",
    async ({ headers, set }) => {
      try {
        const token = getBearerToken(headers.authorization);

        return await getCurrentUser(token);
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          set.status = 401;
          return { error: error.message };
        }

        throw error;
      }
    },
    {
      response: {
        200: currentUserResponse,
        401: unauthorizedResponse,
      },
      detail: {
        tags: ["Auth"],
        summary: "Get current user",
        description:
          "Returns the current authenticated user when the supplied bearer token is valid and still stored as an active session.",
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    },
  )
  .post(
    "/logout",
    async ({ headers, set }) => {
      try {
        const token = getBearerToken(headers.authorization);

        return await logoutUser(token);
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          set.status = 401;
          return { error: error.message };
        }

        throw error;
      }
    },
    {
      response: {
        200: logoutSuccessResponse,
        401: unauthorizedResponse,
      },
      detail: {
        tags: ["Auth"],
        summary: "Log out current user",
        description:
          "Deletes the active session for the supplied bearer token so it can no longer be used.",
        security: [
          {
            bearerAuth: [],
          },
        ],
      },
    },
  );
