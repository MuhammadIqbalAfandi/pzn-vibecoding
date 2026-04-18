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

const registerBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 255 }),
  email: t.String({ format: "email", maxLength: 255 }),
  password: t.String({ minLength: 8, maxLength: 255 }),
});

const loginBody = t.Object({
  email: t.String({ format: "email", maxLength: 255 }),
  password: t.String({ minLength: 8, maxLength: 255 }),
});

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
    },
  )
  .get("/current", async ({ headers, set }) => {
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
  })
  .post("/logout", async ({ headers, set }) => {
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
  });
