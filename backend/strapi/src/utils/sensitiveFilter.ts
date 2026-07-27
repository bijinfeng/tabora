const SENSITIVE_KEYWORDS = ["apikey", "token", "password", "secret", "filepath"]

const FILE_PATH_PATTERNS = [/^\/[A-Za-z]+\//, /^[A-Z]:\\/, /^file:\/\//]

function isFilePath(value: unknown): boolean {
  return typeof value === "string" && FILE_PATH_PATTERNS.some((pattern) => pattern.test(value))
}

/**
 * 返回 payload 中第一个敏感字段的路径；安全则返回 null。
 * 与前端 @tabora/sync 的 sensitiveFilter 语义一致，服务端是主防线。
 */
export function findSensitiveFieldPath(payload: unknown, path = ""): string | null {
  if (typeof payload !== "object" || payload === null) {
    return null
  }

  if (Array.isArray(payload)) {
    for (const [index, item] of payload.entries()) {
      const found = findSensitiveFieldPath(item, path ? `${path}[${index}]` : `[${index}]`)
      if (found) return found
    }
    return null
  }

  for (const [key, value] of Object.entries(payload)) {
    const fullPath = path ? `${path}.${key}` : key
    const lowerKey = key.toLowerCase()

    if (SENSITIVE_KEYWORDS.some((keyword) => lowerKey.includes(keyword))) {
      return fullPath
    }
    if (isFilePath(value)) {
      return fullPath
    }
    const nested = findSensitiveFieldPath(value, fullPath)
    if (nested) return nested
  }

  return null
}
