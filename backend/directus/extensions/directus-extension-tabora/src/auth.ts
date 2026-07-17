import { ErrorCode, InternalServerError, isDirectusError } from "@directus/errors"
import type { Accountability } from "@directus/types"
import { z } from "zod"
import { asyncRoute, parseBody, requireUserId } from "./http"
import {
  createSessionIdentity,
  deleteSessionIdentityByToken,
  lockSessionIdentityByToken,
  rotateSessionIdentity,
} from "./sessionIdentity"
import type { TaboraDatabase, TaboraEndpointContext, TaboraRequest, TaboraRouter } from "./types"

const emailSchema = z
  .string()
  .trim()
  .email()
  .max(254)
  .transform((email) => email.toLowerCase())

const passwordSchema = z.string().min(1).max(1024)
const tokenSchema = z.string().trim().min(1).max(4096)

const credentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

const refreshTokenSchema = z.object({
  refresh_token: tokenSchema,
})

const emailRequestSchema = z.object({
  email: emailSchema,
})

const passwordResetSchema = z
  .object({
    token: tokenSchema.optional(),
    code: tokenSchema.optional(),
    password: passwordSchema,
  })
  .refine((value) => value.token || value.code, {
    message: "token or code is required",
    path: ["token"],
  })

const CURRENT_USER_FIELDS = ["id", "email", "first_name", "last_name", "avatar", "status"] as const

type ServiceRequest = TaboraRequest & {
  accountability?: NonNullable<TaboraRequest["accountability"]> | null
}

function createAnonymousRequestAccountability(request: ServiceRequest): Accountability {
  const userAgent = request.get?.("user-agent")?.slice(0, 1024)
  const origin = request.get?.("origin")

  return {
    role: null,
    roles: [],
    user: null,
    admin: false,
    app: false,
    ip: request.ip ?? null,
    ...(userAgent ? { userAgent } : {}),
    ...(origin ? { origin } : {}),
  }
}

async function createCurrentUserService(context: TaboraEndpointContext, request: ServiceRequest) {
  const schema = await context.getSchema()
  return new context.services.UsersService({
    schema,
    accountability: request.accountability ?? null,
  })
}

async function createAnonymousUsersService(
  context: TaboraEndpointContext,
  request: ServiceRequest,
) {
  const schema = await context.getSchema()
  return new context.services.UsersService({
    schema,
    accountability: createAnonymousRequestAccountability(request),
  })
}

async function createRegistrationUsersService(context: TaboraEndpointContext) {
  const schema = await context.getSchema()
  return new context.services.UsersService({
    schema,
    accountability: null,
  })
}

function requireLoginUserId(result: { id?: string }): string {
  if (!result.id) {
    throw new InternalServerError()
  }

  return result.id
}

async function createAuthenticationService(
  context: TaboraEndpointContext,
  request: ServiceRequest,
  database?: TaboraDatabase,
) {
  const schema = await context.getSchema()
  const options = {
    schema,
    accountability: createAnonymousRequestAccountability(request),
    ...(database ? { knex: database } : {}),
  }

  return new context.services.AuthenticationService(options)
}

export function registerAuthEndpoints(router: TaboraRouter, context: TaboraEndpointContext): void {
  router.post(
    "/auth/register",
    asyncRoute(async (request, response) => {
      const credentials = parseBody(credentialsSchema, request.body)
      const usersService = await createRegistrationUsersService(context)

      await usersService.registerUser(credentials)
      return response.sendStatus(204)
    }),
  )

  router.post(
    "/auth/login",
    asyncRoute(async (request, response) => {
      const credentials = parseBody(credentialsSchema, request.body)
      const authenticationService = await createAuthenticationService(context, request)
      const result = await authenticationService.login("default", credentials, {
        session: false,
      })
      const sessionId = await createSessionIdentity(
        context.database,
        requireLoginUserId(result),
        result.refreshToken,
      )

      return response.json({
        data: {
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
          expires: result.expires,
          session_id: sessionId,
        },
      })
    }),
  )

  router.post(
    "/auth/refresh",
    asyncRoute(async (request, response) => {
      const { refresh_token: refreshToken } = parseBody(refreshTokenSchema, request.body)
      const authenticationService = await createAuthenticationService(context, request)
      const result = await authenticationService.refresh(refreshToken, {
        session: false,
      })
      const userId = requireLoginUserId(result)
      const sessionId = await context.database.transaction(async (transaction) => {
        const identity = await lockSessionIdentityByToken(transaction, refreshToken)

        return identity
          ? await rotateSessionIdentity(transaction, identity, userId, result.refreshToken)
          : await createSessionIdentity(transaction, userId, result.refreshToken)
      })

      return response.json({
        data: {
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
          expires: result.expires,
          session_id: sessionId,
        },
      })
    }),
  )

  router.post(
    "/auth/logout",
    asyncRoute(async (request, response) => {
      const { refresh_token: refreshToken } = parseBody(refreshTokenSchema, request.body)
      const authenticationService = await createAuthenticationService(context, request)

      await authenticationService.logout(refreshToken)

      await context.database.transaction(async (transaction) => {
        const identity = await lockSessionIdentityByToken(transaction, refreshToken)

        if (identity) {
          await deleteSessionIdentityByToken(transaction, identity.user_id, refreshToken)
        }
      })

      return response.sendStatus(204)
    }),
  )

  router.get(
    "/auth/session",
    asyncRoute(async (request, response) => {
      const userId = requireUserId(request)
      const usersService = await createCurrentUserService(context, request)

      try {
        const user = await usersService.readOne(userId, {
          fields: [...CURRENT_USER_FIELDS],
        })

        return response.json({ data: user })
      } catch (error: unknown) {
        // 与 Directus /users/me 对齐：无权读 directus_users（如 role=null）时只回 id
        if (isDirectusError(error, ErrorCode.Forbidden)) {
          return response.json({ data: { id: userId } })
        }

        throw error
      }
    }),
  )

  router.post(
    "/auth/send-code",
    asyncRoute(async (request, response) => {
      const { email } = parseBody(emailRequestSchema, request.body)
      const usersService = await createAnonymousUsersService(context, request)

      try {
        await usersService.requestPasswordReset(email, null)
      } catch (error: unknown) {
        if (isDirectusError(error, ErrorCode.InvalidPayload)) {
          throw error
        }

        context.logger.warn(error, "Password reset request failed")
      }

      return response.sendStatus(204)
    }),
  )

  router.post(
    "/auth/verify-code",
    asyncRoute(async (request, response) => {
      const payload = parseBody(passwordResetSchema, request.body)
      const resetToken = payload.token ?? payload.code

      if (!resetToken) {
        throw new TypeError("Password reset token was not parsed")
      }

      const usersService = await createAnonymousUsersService(context, request)
      await usersService.resetPassword(resetToken, payload.password)

      return response.sendStatus(204)
    }),
  )
}
