const SENSITIVE_KEYWORDS = ["apikey", "token", "password", "secret", "filepath"]
const SAFE_KEYS = ["tokens"] // 主题 design tokens 例外
const FILE_PATH_PATTERNS = [/^\/[A-Za-z]+\//, /^[A-Z]:\\/, /^file:\/\//]

function isFilePath(value: unknown): boolean {
  return typeof value === "string" && FILE_PATH_PATTERNS.some((p) => p.test(value))
}

/**
 * 返回 payload 中第一个敏感字段路径；无敏感字段返回 null。
 * 服务端是主防线，与前端 @tabora/sync 语义一致。
 */
export function findSensitiveFieldPath(payload: unknown, path = ""): string | null {
  if (typeof payload !== "object" || payload === null) return null

  if (Array.isArray(payload)) {
    for (const [i, item] of payload.entries()) {
      const found = findSensitiveFieldPath(item, path ? `${path}[${i}]` : `[${i}]`)
      if (found) return found
    }
    return null
  }

  for (const [key, value] of Object.entries(payload)) {
    const fullPath = path ? `${path}.${key}` : key
    const lowerKey = key.toLowerCase()
    if (!SAFE_KEYS.includes(lowerKey) && SENSITIVE_KEYWORDS.some((kw) => lowerKey.includes(kw))) {
      return fullPath
    }
    if (isFilePath(value)) return fullPath
    const nested = findSensitiveFieldPath(value, fullPath)
    if (nested) return nested
  }
  return null
}
