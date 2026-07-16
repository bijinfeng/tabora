import { createError } from "@directus/errors"
import { z } from "zod"
import { asyncRoute, parseBody, requireUserId } from "./http"
import { readSessionId } from "./sessionIdentity"
import type { DirectusSessionRow, TaboraEndpointContext, TaboraRouter } from "./types"

const SessionNotFoundError = createError("SESSION_NOT_FOUND", "Session not found.", 404)

const revokeSessionSchema = z.object({
  session_id: z
    .string()
    .uuid()
    .transform((value) => value.toLowerCase()),
})

const SESSION_COLUMNS = [
  "token",
  "data",
  "created_at",
  "expires",
  "ip",
  "user_agent",
  "origin",
] as const

function isActiveSession(session: DirectusSessionRow): boolean {
  if (!session.expires) {
    return false
  }

  const expiresAt = new Date(session.expires).getTime()
  return Number.isFinite(expiresAt) && expiresAt >= Date.now()
}

export function registerSessionEndpoints(
  router: TaboraRouter,
  context: TaboraEndpointContext,
): void {
  router.get(
    "/auth/devices",
    asyncRoute(async (request, response) => {
      const userId = requireUserId(request)
      const sessions = (await context.database
        .select(...SESSION_COLUMNS)
        .from("directus_sessions")
        .where({ user: userId, oauth_client: null })
        .orderBy("created_at", "desc")) as DirectusSessionRow[]

      return response.json({
        data: {
          devices: sessions.filter(isActiveSession).flatMap((session) => {
            const sessionId = readSessionId(session.data)

            if (!sessionId) {
              return []
            }

            return [
              {
                id: sessionId,
                created_at: session.created_at,
                expires: session.expires,
                ip: session.ip,
                user_agent: session.user_agent,
                origin: session.origin,
                ...(request.accountability?.session === session.token ? { current: true } : {}),
              },
            ]
          }),
        },
      })
    }),
  )

  router.post(
    "/auth/revoke",
    asyncRoute(async (request, response) => {
      const userId = requireUserId(request)
      const { session_id: sessionId } = parseBody(revokeSessionSchema, request.body)
      await context.database.transaction(async (transaction) => {
        const sessions = (await transaction
          .select("token", "data")
          .from("directus_sessions")
          .where({ user: userId, oauth_client: null })
          .forUpdate()) as Array<{ token?: unknown; data?: unknown }>
        const session = sessions.find(
          (candidate): candidate is { token: string; data?: unknown } =>
            typeof candidate.token === "string" && readSessionId(candidate.data) === sessionId,
        )

        if (!session) {
          throw new SessionNotFoundError()
        }

        const schema = await context.getSchema()
        const authenticationService = new context.services.AuthenticationService({
          schema,
          accountability: request.accountability ?? null,
          knex: transaction,
        })
        await authenticationService.logout(session.token)
      })

      return response.sendStatus(204)
    }),
  )
}
