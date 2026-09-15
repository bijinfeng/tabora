import type { PluginNetworkAccess } from "./runtime"

export type PluginAiToolErrorCode =
  | "plugin_tool_not_found"
  | "plugin_tool_not_registered"
  | "plugin_tool_permission_denied"
  | "plugin_tool_invalid_input"
  | "plugin_tool_execution_timeout"
  | "plugin_tool_execution_failed"
  | "plugin_tool_result_not_serializable"

export class PluginAiToolError extends Error {
  readonly code: PluginAiToolErrorCode
  constructor(code: PluginAiToolErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = "PluginAiToolError"
    this.code = code
  }
}

export type PluginAiToolContext = {
  pluginId: string
  instanceId?: string
  network: PluginNetworkAccess
  logger: {
    warn(message: string): void
    error(message: string): void
  }
}

export type PluginAiToolHandler = (input: {
  args: Record<string, unknown>
  context: PluginAiToolContext
}) => Promise<unknown>

export type PluginAiToolRegistration = {
  register(toolId: string, handler: PluginAiToolHandler): () => void
}
