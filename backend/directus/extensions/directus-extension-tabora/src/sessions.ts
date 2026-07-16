import { createError } from "@directus/errors"
import { z } from "zod"
import { asyncRoute, parseBody, requireUserId } from "./http"
import { sessionTokenMatchesHash } from "./sessionIdentity"
import type { DirectusSessionRow, TaboraEndpointContext, TaboraRouter } from "./types"

const SessionNotFoundError = createError("SESSION_NOT_FOUND", "Session not found.", 404)

const revokeSessionSchema = z.object({
  session_id: z
    .string()
    .uuid()
    .transform((value) => value.toLowerCase()),
})

const SESSION_COLUMNS = ["token", "created_at", "expires", "ip", "user_agent", "origin"] as const

type SessionIdentitySummary = {
  id: number
  user_id: string
  session_id: string
  token_hash: string
}

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
      const [sessions, identities] = await Promise.all([
        context.database
          .select(...SESSION_COLUMNS)
          .from("directus_sessions")
          .where({ user: userId, oauth_client: null })
          .orderBy("created_at", "desc") as Promise<DirectusSessionRow[]>,
        context.database
          .select("session_id", "token_hash")
          .from("user_refresh_tokens")
          .where({ user_id: userId }) as Promise<
          Array<Pick<SessionIdentitySummary, "session_id" | "token_hash">>
        >,
      ])

      return response.json({
        data: {
          devices: sessions.filter(isActiveSession).flatMap((session) => {
            const identity = identities.find((candidate) =>
              sessionTokenMatchesHash(session.token, candidate.token_hash),
            )

            if (!identity) {
              return []
            }

            return [
              {
                id: identity.session_id,
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
        const identity = (await transaction
          .select("id", "user_id", "session_id", "token_hash")
          .from("user_refresh_tokens")
          .where({ session_id: sessionId, user_id: userId })
          .forUpdate()
          .first()) as SessionIdentitySummary | undefined

        if (!identity) {
          throw new SessionNotFoundError()
        }

        const sessions = (await transaction
          .select("token")
          .from("directus_sessions")
          .where({ user: userId, oauth_client: null })
          .forUpdate()) as Array<{ token: string }>

        const session = sessions.find((candidate) =>
          sessionTokenMatchesHash(candidate.token, identity.token_hash),
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

        await transaction("user_refresh_tokens")
          .where({ id: identity.id, user_id: identity.user_id })
          .del()
      })

      return response.sendStatus(204)
    }),
  )
}
