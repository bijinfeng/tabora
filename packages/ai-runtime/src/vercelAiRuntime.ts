import { generateText as vercelGenerateText, streamText as vercelStreamText } from "ai"
import type {
  AiGenerateRequest,
  AiGenerateResult,
  AiRuntimeBridge,
  AiStreamChunk,
  AiTokenUsage,
  AiToolApprovalRequest,
  AiToolApprovalResult,
  AiToolDefinition,
} from "@tabora/plugin-api"

export type AiRuntimeErrorCode = "ai_not_configured" | "ai_provider_failed"

export class AiRuntimeError extends Error {
  readonly code: AiRuntimeErrorCode

  constructor(code: AiRuntimeErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = "AiRuntimeError"
    this.code = code
  }
}

export type VercelAiRuntimeConfig = {
  enabled: boolean
  defaultTextModel?: string
  defaultTemperature?: number
  maxOutputTokens?: number
}

export type VercelGenerateTextResult = {
  text: string
  finishReason?: string
  usage?: AiTokenUsage
}

export type VercelStreamTextResult = {
  textStream: AsyncIterable<string>
}

export type VercelGenerateText = (
  options: Record<string, unknown>,
) => Promise<VercelGenerateTextResult>

export type VercelStreamText = (options: Record<string, unknown>) => VercelStreamTextResult

export type CreateVercelAiRuntimeOptions = {
  config: VercelAiRuntimeConfig
  generateText?: VercelGenerateText
  streamText?: VercelStreamText
  requestToolApproval?: (request: AiToolApprovalRequest) => Promise<AiToolApprovalResult>
}

const defaultGenerateText = vercelGenerateText as unknown as VercelGenerateText
const defaultStreamText = vercelStreamText as unknown as VercelStreamText

export function createVercelAiRuntime(options: CreateVercelAiRuntimeOptions): AiRuntimeBridge {
  const generateText = options.generateText ?? defaultGenerateText
  const streamText = options.streamText ?? defaultStreamText

  return {
    async generate(request) {
      const textModel = resolveTextModel(options.config, request)

      try {
        const result = await generateText({
          ...buildGenerationOptions(options, request, textModel),
          tools: buildVercelTools(request.tools, options.requestToolApproval),
        })

        return normalizeGenerateResult(result)
      } catch (error) {
        if (error instanceof AiRuntimeError) throw error
        throw new AiRuntimeError("ai_provider_failed", "AI provider request failed", {
          cause: error,
        })
      }
    },

    async *stream(request): AsyncIterable<AiStreamChunk> {
      const textModel = resolveTextModel(options.config, request)

      try {
        const result = streamText(buildGenerationOptions(options, request, textModel))
        for await (const text of result.textStream) {
          yield { type: "text-delta", text }
        }
        yield { type: "finish" }
      } catch (error) {
        if (error instanceof AiRuntimeError) throw error
        throw new AiRuntimeError("ai_provider_failed", "AI provider request failed", {
          cause: error,
        })
      }
    },
  }
}

function resolveTextModel(config: VercelAiRuntimeConfig, request: AiGenerateRequest): string {
  if (!config.enabled) {
    throw new AiRuntimeError("ai_not_configured", "AI runtime is disabled")
  }

  const model = request.model ?? config.defaultTextModel
  if (!model) {
    throw new AiRuntimeError("ai_not_configured", "AI text model is not configured")
  }

  return model
}

function buildGenerationOptions(
  options: CreateVercelAiRuntimeOptions,
  request: AiGenerateRequest,
  model: string,
): Record<string, unknown> {
  return compactRecord({
    model,
    prompt: request.prompt,
    system: request.system,
    temperature: request.temperature ?? options.config.defaultTemperature,
    maxOutputTokens: request.maxOutputTokens ?? options.config.maxOutputTokens,
    abortSignal: request.abortSignal,
  })
}

function buildVercelTools(
  tools: AiToolDefinition[] | undefined,
  requestToolApproval: CreateVercelAiRuntimeOptions["requestToolApproval"],
): Record<string, unknown> | undefined {
  if (!tools?.length) return undefined

  return Object.fromEntries(
    tools.map((tool) => [
      tool.id,
      compactRecord({
        description: tool.description,
        inputSchema: tool.inputSchema,
        execute: tool.execute
          ? async (input: unknown) => executeToolWithApproval(tool, input, requestToolApproval)
          : undefined,
      }),
    ]),
  )
}

async function executeToolWithApproval(
  tool: AiToolDefinition,
  input: unknown,
  requestToolApproval: CreateVercelAiRuntimeOptions["requestToolApproval"],
): Promise<unknown> {
  if (tool.requiresConfirmation) {
    const approval = requestToolApproval
      ? await requestToolApproval({
          toolId: tool.id,
          input,
          ...(tool.description ? { description: tool.description } : {}),
        })
      : { approved: false, reason: "approval host is not available" }

    if (!approval.approved) {
      return { ok: false, reason: approval.reason ?? "tool call rejected" }
    }
  }

  return tool.execute?.(input)
}

function normalizeGenerateResult(result: VercelGenerateTextResult): AiGenerateResult {
  return compactRecord({
    text: result.text,
    finishReason: result.finishReason,
    usage: normalizeUsage(result.usage),
  }) as AiGenerateResult
}

function normalizeUsage(usage: AiTokenUsage | undefined): AiTokenUsage | undefined {
  if (!usage) return undefined
  return compactRecord({
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    totalTokens: usage.totalTokens,
  }) as AiTokenUsage
}

function compactRecord<T extends Record<string, unknown>>(record: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  ) as Partial<T>
}
