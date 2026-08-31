import { lookup } from "node:dns/promises"
import { isIP } from "node:net"

import {
  AiRuntimeError,
  aiErrorResponse,
  aiStreamResponse,
  createTanstackAiGateway,
  parseAiGatewayRequest,
  type AiCustomProviderConfig,
  type AiTextGateway,
} from "@tabora/ai-runtime/server"

import type { AppEnv } from "./env"
import type { ServerRuntime } from "./runtime"
import { getSessionUserId, json } from "./http"

function configuredBuiltinModels(env: AppEnv) {
  return env.aiBuiltinProviders.flatMap((provider) =>
    provider.models.map((model) => ({
      id: `${provider.id}:${model}`,
      label: `${provider.id} · ${model}`,
      model,
      apiKey: provider.apiKey,
      baseUrl: provider.baseUrl,
    })),
  )
}

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
export async function validateCloudCustomProvider(provider: AiCustomProviderConfig): Promise<void> {
  let url: URL
  try {
    url = new URL(provider.baseUrl)
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

export function createCloudAiGateway(env: AppEnv) {
  return createTanstackAiGateway({
    builtinModels: configuredBuiltinModels(env),
    validateCustomProvider: validateCloudCustomProvider,
  })
}

export function cloudBuiltinModels(env: AppEnv): Array<{ id: string; label: string }> {
  return configuredBuiltinModels(env).map(({ id, label }) => ({ id, label }))
}

type CloudAiRuntime = Pick<ServerRuntime, "auth" | "env">

async function authorizeBuiltinAi(
  runtime: CloudAiRuntime,
  request: Request,
  provider: "builtin" | "custom",
) {
  if (provider !== "builtin") return
  const userId = await getSessionUserId(runtime.auth, request)
  if (!userId) throw new AiRuntimeError("ai_auth_required", "Sign in to use built-in AI models")
}

/**
 * Shared HTTP contract for the cloud text endpoint. It deliberately receives
 * the gateway as a dependency so the route behavior can be tested without a
 * provider credential or network access.
 */
export async function cloudAiGenerateResponse(
  runtime: CloudAiRuntime,
  request: Request,
  gateway: AiTextGateway = createCloudAiGateway(runtime.env),
): Promise<Response> {
  try {
    const input = parseAiGatewayRequest(await request.json().catch(() => null))
    await authorizeBuiltinAi(runtime, request, input.provider)
    return Response.json(await gateway.generate(input))
  } catch (error) {
    return aiErrorResponse(error)
  }
}

/** Cloud stream endpoint uses the same authentication and input contract as generate. */
export async function cloudAiStreamResponse(
  runtime: CloudAiRuntime,
  request: Request,
  gateway: AiTextGateway = createCloudAiGateway(runtime.env),
): Promise<Response> {
  try {
    const input = parseAiGatewayRequest(await request.json().catch(() => null))
    await authorizeBuiltinAi(runtime, request, input.provider)
    return aiStreamResponse(gateway, input)
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
  return json({ models: cloudBuiltinModels(runtime.env) })
}
