import { createHash, randomUUID, timingSafeEqual } from "node:crypto"
import { InternalServerError } from "@directus/errors"
import type { TaboraDatabase } from "./types"

const SESSION_TOKEN_HASH_PATTERN = /^[a-f0-9]{64}$/i

export type SessionIdentityRow = {
  id?: number
  user_id: string
  session_id: string
  token_hash: string
}

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex")
}

export function sessionTokenMatchesHash(token: string, expectedHash: string): boolean {
  if (!SESSION_TOKEN_HASH_PATTERN.test(expectedHash)) {
    return false
  }

  const actualHash = hashSessionToken(token)

  if (!SESSION_TOKEN_HASH_PATTERN.test(actualHash)) {
    return false
  }

  return timingSafeEqual(
    Buffer.from(actualHash, "hex"),
    Buffer.from(expectedHash.toLowerCase(), "hex"),
  )
}

function assertValidIdentity(identity: SessionIdentityRow): void {
  if (
    typeof identity.user_id !== "string" ||
    !identity.user_id ||
    typeof identity.session_id !== "string" ||
    !identity.session_id ||
    typeof identity.token_hash !== "string" ||
    !SESSION_TOKEN_HASH_PATTERN.test(identity.token_hash)
  ) {
    throw new InternalServerError()
  }
}

export async function lockSessionIdentityByToken(
  database: TaboraDatabase,
  token: string,
): Promise<SessionIdentityRow | undefined> {
  const identities = (await database
    .select("id", "user_id", "session_id", "token_hash")
    .from("user_refresh_tokens")
    .where({ token_hash: hashSessionToken(token) })
    .forUpdate()) as SessionIdentityRow[]

  if (identities.length === 0) {
    return undefined
  }

  if (identities.length > 1) {
    throw new InternalServerError()
  }

  const identity = identities[0] as SessionIdentityRow
  assertValidIdentity(identity)

  return identity
}

export async function createSessionIdentity(
  database: TaboraDatabase,
  userId: string,
  token: string,
): Promise<string> {
  const sessionId = randomUUID()

  await database("user_refresh_tokens").insert({
    user_id: userId,
    session_id: sessionId,
    token_hash: hashSessionToken(token),
  })

  return sessionId
}

export async function rotateSessionIdentity(
  database: TaboraDatabase,
  identity: SessionIdentityRow,
  userId: string,
  nextToken: string,
): Promise<string> {
  assertValidIdentity(identity)

  if (identity.user_id !== userId) {
    throw new InternalServerError()
  }

  const updated = await database("user_refresh_tokens")
    .where({ id: identity.id, user_id: userId })
    .update({
      token_hash: hashSessionToken(nextToken),
    })

  if (updated !== 1) {
    throw new InternalServerError()
  }

  return identity.session_id
}

export async function deleteSessionIdentityByToken(
  database: TaboraDatabase,
  userId: string,
  token: string,
): Promise<void> {
  await database("user_refresh_tokens")
    .where({ user_id: userId, token_hash: hashSessionToken(token) })
    .del()
}
