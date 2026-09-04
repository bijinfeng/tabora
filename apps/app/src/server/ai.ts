import { lookup } from "node:dns/promises"
import { open } from "node:fs/promises"
import { isIP } from "node:net"

import {
  AiRuntimeError,
  aiErrorResponse,
  aiStreamResponse,
  createTanstackAiGateway,
  createAttachmentTools,
  parseAiGatewayRequest,
  type AiCustomProviderConfig,
  type AiTextGateway,
  type AiAttachmentToolResource,
} from "@tabora/ai-runtime/server"

import type { ServerRuntime } from "./runtime"
import { getAiUsageTracker } from "./aiUsage"
import { getSessionUserId, json } from "./http"

function isPrivateIpv4(value: string): boolean {
  const parts = value.split(".").map(Number)
  if (
    parts.length !== 4 ||
    parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)
  ) {
    return true
  }
  const [first, second] = parts
  if (first === undefined || second === undefined) return true
  return (
    first === 10 ||
    first === 127 ||
    first === 0 ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 168) ||
    (first === 100 && second >= 64 && second <= 127)
  )
}

function isUnsafeAddress(value: string): boolean {
  if (isIP(value) === 4) return isPrivateIpv4(value)
  if (isIP(value) === 6) {
    const normalized = value.toLowerCase()
    return (
      normalized === "::1" ||
      normalized.startsWith("fe80:") ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd")
    )
  }
  return false
}

/** Custom cloud providers are user-supplied but must never turn the gateway into an SSRF proxy. */
export async function validateCloudProviderUrl(baseUrl: string): Promise<void> {
  let url: URL
  try {
    url = new URL(baseUrl)
  } catch {
    throw new AiRuntimeError("ai_request_rejected", "Invalid custom AI base URL")
  }
  if (url.protocol !== "https:" || url.username || url.password || isUnsafeAddress(url.hostname)) {
    throw new AiRuntimeError("ai_request_rejected", "Custom AI base URL is not allowed")
  }
  try {
    const addresses = await lookup(url.hostname, { all: true })
    if (!addresses.length || addresses.some((address) => isUnsafeAddress(address.address))) {
      throw new AiRuntimeError("ai_request_rejected", "Custom AI base URL is not allowed")
    }
  } catch (error) {
    if (error instanceof AiRuntimeError) throw error
    throw new AiRuntimeError("ai_request_rejected", "Custom AI base URL cannot be resolved")
  }
}

/** Custom cloud providers are user-supplied but must never turn the gateway into an SSRF proxy. */
export async function validateCloudCustomProvider(provider: AiCustomProviderConfig): Promise<void> {
  return validateCloudProviderUrl(provider.baseUrl)
}

export function createCloudAiGateway(
  builtinModels: Awaited<
    ReturnType<ServerRuntime["handle"]["aiModels"]["listActiveGatewayModels"]>
  >,
  attachmentResources: readonly AiAttachmentToolResource[] = [],
  usage: Pick<
    NonNullable<Parameters<typeof createTanstackAiGateway>[0]>,
    "usageTracker" | "budget"
  > = {},
) {
  return createTanstackAiGateway({
    builtinModels,
    validateCustomProvider: validateCloudCustomProvider,
    tools: () => createAttachmentTools(attachmentResources),
    ...usage,
  })
}

type CloudAiRuntime = Pick<ServerRuntime, "auth" | "handle" | "storage">

async function authorizeBuiltinAi(
  runtime: CloudAiRuntime,
  request: Request,
  provider: "builtin" | "custom",
): Promise<string | undefined> {
  if (provider !== "builtin") return undefined
  const userId = await getSessionUserId(runtime.auth, request)
  if (!userId) throw new AiRuntimeError("ai_auth_required", "Sign in to use built-in AI models")
  return userId
}

async function aiBudget(runtime: CloudAiRuntime) {
  const [maxRequests, maxTotalTokens] = await Promise.all([
    runtime.handle.settings.get("aiMonthlyRequestLimit"),
    runtime.handle.settings.get("aiMonthlyTokenLimit"),
  ])
  return {
    ...(maxRequests > 0 ? { maxRequests } : {}),
    ...(maxTotalTokens > 0 ? { maxTotalTokens } : {}),
  }
}

/** Resolve only current-user references, leaving every storage detail in the host process. */
async function resolveAttachmentTools(
  runtime: CloudAiRuntime,
  userId: string,
  attachmentIds: readonly string[] | undefined,
): Promise<AiAttachmentToolResource[]> {
  const resources: AiAttachmentToolResource[] = []
  for (const id of attachmentIds ?? []) {
    const fileId = Number(id)
    if (
      !Number.isSafeInteger(fileId) ||
      !(await runtime.handle.attachments.ownsRef(fileId, userId))
    ) {
      throw new AiRuntimeError("ai_request_rejected", "AI attachment is unavailable")
    }
    const file = await runtime.handle.attachments.getFile(fileId)
    if (!file) throw new AiRuntimeError("ai_request_rejected", "AI attachment is unavailable")
    resources.push({
      id,
      filename: file.filename,
      mimeType: file.mime,
      size: file.sizeBytes,
      async read({ offset, length }) {
        const descriptor = await open(runtime.storage.absolutePath(file.storageKey), "r")
        try {
          const bytes = Buffer.alloc(length)
          const { bytesRead } = await descriptor.read(bytes, 0, length, offset)
          return new Uint8Array(bytes.subarray(0, bytesRead))
        } finally {
          await descriptor.close()
        }
      },
    })
  }
  return resources
}

async function cloudGatewayForRequest(
  runtime: CloudAiRuntime,
  request: Request,
  input: ReturnType<typeof parseAiGatewayRequest>,
  authorizedUserId?: string,
) {
  const userId =
    authorizedUserId ??
    (input.attachmentIds?.length ? await getSessionUserId(runtime.auth, request) : undefined)
  if (input.attachmentIds?.length && !userId) {
    throw new AiRuntimeError("ai_auth_required", "Sign in to use AI attachments")
  }
  return createCloudAiGateway(
    input.provider === "builtin" ? await runtime.handle.aiModels.listActiveGatewayModels() : [],
    userId ? await resolveAttachmentTools(runtime, userId, input.attachmentIds) : [],
    input.provider === "builtin" && userId
      ? { usageTracker: getAiUsageTracker(userId), budget: await aiBudget(runtime) }
      : {},
  )
}

/**
 * Shared HTTP contract for the cloud text endpoint. It deliberately receives
 * the gateway as a dependency so the route behavior can be tested without a
 * provider credential or network access.
 */
export async function cloudAiGenerateResponse(
  runtime: CloudAiRuntime,
  request: Request,
  gateway?: AiTextGateway,
): Promise<Response> {
  try {
    const input = parseAiGatewayRequest(await request.json().catch(() => null))
    const userId = await authorizeBuiltinAi(runtime, request, input.provider)
    const activeGateway = gateway ?? (await cloudGatewayForRequest(runtime, request, input, userId))
    return Response.json(await activeGateway.generate(input))
  } catch (error) {
    return aiErrorResponse(error)
  }
}

/** Cloud stream endpoint uses the same authentication and input contract as generate. */
export async function cloudAiStreamResponse(
  runtime: CloudAiRuntime,
  request: Request,
  gateway?: AiTextGateway,
): Promise<Response> {
  try {
    const input = parseAiGatewayRequest(await request.json().catch(() => null))
    const userId = await authorizeBuiltinAi(runtime, request, input.provider)
    const activeGateway = gateway ?? (await cloudGatewayForRequest(runtime, request, input, userId))
    return aiStreamResponse(activeGateway, input)
  } catch (error) {
    return aiErrorResponse(error)
  }
}

/** Platform-paid model metadata is never exposed before a Tabora session is validated. */
export async function cloudAiModelsResponse(
  runtime: CloudAiRuntime,
  request: Request,
): Promise<Response> {
  const userId = await getSessionUserId(runtime.auth, request)
  if (!userId) {
    return json(
      { error: { code: "ai_auth_required", message: "Sign in to view built-in AI models" } },
      401,
    )
  }
  return json({ models: await runtime.handle.aiModels.listActiveDirectory() })
}

function discoveredModelIds(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") return []
  const raw = "data" in payload ? payload.data : "models" in payload ? payload.models : undefined
  if (!Array.isArray(raw)) return []
  return [
    ...new Set(
      raw.flatMap((item) => {
        const id =
          typeof item === "string"
            ? item
            : item && typeof item === "object" && "id" in item
              ? item.id
              : undefined
        return typeof id === "string" && id.trim() ? [id.trim()] : []
      }),
    ),
  ].sort((left, right) => left.localeCompare(right))
}

/** Fetches a user's custom provider model catalogue server-side to avoid third-party CORS. */
export async function customAiModelsResponse(request: Request): Promise<Response> {
  try {
    const body = (await request.json().catch(() => null)) as {
      baseUrl?: unknown
      apiKey?: unknown
    } | null
    if (typeof body?.baseUrl !== "string" || typeof body.apiKey !== "string") {
      return json({ error: { message: "Invalid provider configuration" } }, 400)
    }
    await validateCloudProviderUrl(body.baseUrl)
    const apiKey = body.apiKey.trim()
    const response = await fetch(`${body.baseUrl.replace(/\/$/, "")}/models`, {
      ...(apiKey ? { headers: { authorization: `Bearer ${apiKey}` } } : {}),
      redirect: "error",
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) return json({ error: { message: "Provider rejected the request" } }, 502)
    const models = discoveredModelIds(await response.json().catch(() => null)).slice(0, 200)
    if (!models.length) return json({ error: { message: "Provider returned no models" } }, 502)
    return json({ models })
  } catch {
    return json({ error: { message: "Unable to fetch provider models" } }, 502)
  }
}
