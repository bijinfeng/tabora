import type { AiGenerateRequest, AiGenerateResult, AiStreamChunk } from "@tabora/plugin-api"

export type AiProviderMode = "builtin" | "custom"

export type AiCustomProviderConfig = {
  baseUrl: string
  apiKey: string
  model: string
}

export type AiGatewayRequest = Pick<
  AiGenerateRequest,
  "prompt" | "system" | "temperature" | "maxOutputTokens"
> & {
  provider: AiProviderMode
  modelId?: string
  custom?: AiCustomProviderConfig
}

export type AiGatewayResponse = AiGenerateResult
export type AiGatewayStreamChunk = AiStreamChunk

export type AiGatewayClientConfig = {
  baseUrl: string
  getRequest(): Promise<Pick<AiGatewayRequest, "provider" | "modelId" | "custom">>
  getAuthorization?(): Promise<string | undefined>
  fetcher?: typeof fetch
}

/** Host-owned options for a TanStack AI ChatClient backed by the Tabora gateway. */
export type AiChatClientConfig = AiGatewayClientConfig
