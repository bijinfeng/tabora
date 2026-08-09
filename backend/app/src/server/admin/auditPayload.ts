/**
 * 审计记录的载荷构造：脱敏与资源 ID 提取。
 *
 * 与 middleware.ts 分开，是因为这里不依赖 TanStack Start 运行时，
 * 可以在普通 node 测试里直接导入（导入 @tanstack/solid-start 会拉入客户端代码）。
 */

/** 需要脱敏的敏感字段名（大小写不敏感匹配）。 */
const SENSITIVE_KEYS = ["password", "secret", "token", "apikey", "api_key", "credential"]

/**
 * 递归脱敏对象中的敏感字段，返回可安全存储的副本。
 */
export function redactSensitive(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactSensitive)
  }
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const isSensitive = SENSITIVE_KEYS.some((s) => key.toLowerCase().includes(s))
      result[key] = isSensitive ? "[REDACTED]" : redactSensitive(val)
    }
    return result
  }
  return value
}

/** 一次管理操作的审计描述。 */
export type AuditDescriptor = {
  /** 记录到 action 的操作标识，沿用旧后端的 `METHOD /admin-api/...` 形式。 */
  action: string
  /** 资源类型，与审计页筛选项一致。 */
  resourceType: string | null
  /** 从入参提取资源 ID；入参此时尚未经过 server function 的 validator，需要防御性读取。 */
  resourceId?: (data: Record<string, unknown>) => string | null
}

/** 从入参的指定字段读取资源 ID，缺失时记为 null。 */
export function idFrom(key: string): (data: Record<string, unknown>) => string | null {
  return (data) => {
    const value = data[key]
    return value == null ? null : String(value)
  }
}

export function extractResourceId(
  descriptor: AuditDescriptor,
  data: Record<string, unknown> | undefined,
): string | null {
  if (!descriptor.resourceId || !data) return null
  try {
    return descriptor.resourceId(data)
  } catch {
    return null
  }
}

/**
 * 构造写入 audit_log.details 的 JSON 字符串。
 *
 * 成功时只记录脱敏入参；失败时额外记录错误信息。
 * 两种情况都只做一次 JSON.stringify，避免入参被二次转义。
 */
export function buildDetails(data: unknown, errorMessage?: string): string | null {
  if (data === undefined && errorMessage === undefined) return null
  try {
    // 脱敏必须在 try 内：循环引用的入参会让递归栈溢出
    const input = data === undefined ? undefined : redactSensitive(data)
    if (errorMessage === undefined) return JSON.stringify(input)
    return JSON.stringify({ error: errorMessage, ...(input === undefined ? {} : { input }) })
  } catch {
    // 入参不可脱敏或不可序列化时，不能丢掉失败信息本身
    return errorMessage === undefined ? null : JSON.stringify({ error: errorMessage })
  }
}
