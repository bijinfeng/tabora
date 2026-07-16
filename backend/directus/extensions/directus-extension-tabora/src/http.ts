import { InvalidCredentialsError, InvalidPayloadError } from "@directus/errors"
import type { z } from "zod"
import type { AsyncRouteHandler, TaboraRequest, TaboraRequestHandler } from "./types"

function formatZodIssue(issue: z.core.$ZodIssue): string {
  const path = issue.path.length > 0 ? issue.path.join(".") : "body"
  return `${path}: ${issue.message}`
}

export function parseBody<TSchema extends z.ZodType>(
  schema: TSchema,
  body: unknown,
): z.output<TSchema> {
  const result = schema.safeParse(body)

  if (!result.success) {
    throw new InvalidPayloadError({
      reason: result.error.issues.map(formatZodIssue).join("; "),
    })
  }

  return result.data
}

export function requireUserId(request: TaboraRequest): string {
  const userId = request.accountability?.user

  if (!userId) {
    throw new InvalidCredentialsError()
  }

  return userId
}

export function asyncRoute<TBody, TParams extends Record<string, string>>(
  handler: AsyncRouteHandler<TBody, TParams>,
): TaboraRequestHandler {
  return (request, response, next) =>
    handler(request as TaboraRequest<TBody, TParams>, response, next).catch(next)
}
