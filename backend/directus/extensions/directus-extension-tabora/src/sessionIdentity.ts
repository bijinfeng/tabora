import { randomUUID } from "node:crypto"
import { InternalServerError } from "@directus/errors"
import type { TaboraDatabase } from "./types"

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

type JsonObject = Record<string, unknown>

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function parseSessionData(data: unknown): unknown {
  if (typeof data !== "string") {
    return data
  }

  try {
    return JSON.parse(data)
  } catch {
    return null
  }
}

function requireSessionData(data: unknown): JsonObject {
  let parsed = data

  if (typeof data === "string") {
    try {
      parsed = JSON.parse(data)
    } catch {
      throw new InternalServerError()
    }
  }

  if (parsed === null || parsed === undefined) {
    return {}
  }

  if (!isJsonObject(parsed)) {
    throw new InternalServerError()
  }

  return parsed
}

export function readSessionId(data: unknown): string | null {
  const sessionData = parseSessionData(data)

  if (!isJsonObject(sessionData) || !isJsonObject(sessionData.tabora)) {
    return null
  }

  const sessionId = sessionData.tabora.session_id
  return typeof sessionId === "string" && UUID_V4_PATTERN.test(sessionId)
    ? sessionId.toLowerCase()
    : null
}

export async function ensureSessionId(database: TaboraDatabase, token: string): Promise<string> {
  const session = (await database
    .select("data")
    .from("directus_sessions")
    .where({ token })
    .forUpdate()
    .first()) as { data?: unknown } | undefined

  if (!session) {
    throw new InternalServerError()
  }

  const existingSessionId = readSessionId(session.data)
  if (existingSessionId) {
    return existingSessionId
  }

  const sessionData = requireSessionData(session.data)
  const taboraData = sessionData.tabora

  if (taboraData !== null && taboraData !== undefined && !isJsonObject(taboraData)) {
    throw new InternalServerError()
  }

  const sessionId = randomUUID()
  const updated = await database("directus_sessions")
    .where({ token })
    .update({
      data: {
        ...sessionData,
        tabora: {
          ...(taboraData ?? {}),
          session_id: sessionId,
        },
      },
    })

  if (updated !== 1) {
    throw new InternalServerError()
  }

  return sessionId
}
