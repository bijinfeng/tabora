/**
 * Sensitive field filter - rejects records containing sensitive data.
 * This is a CLIENT-SIDE pre-filter to reduce upload size.
 * The gateway performs the same check as the primary defense.
 */

const SENSITIVE_KEYWORDS = ["apikey", "token", "password", "secret", "filepath"]

const FILE_PATH_PATTERNS = [
  /^\/[A-Za-z]+\//, // Unix absolute paths: /Users/, /home/
  /^[A-Z]:\\/, // Windows absolute paths: C:\
  /^file:\/\//, // file:// URLs
]

export class SensitiveFieldError extends Error {
  constructor(
    public readonly path: string,
    message?: string,
  ) {
    super(message ?? `Sensitive field detected: ${path}`)
    this.name = "SensitiveFieldError"
  }
}

/**
 * Check if a value looks like a file path.
 */
function isFilePath(value: unknown): boolean {
  if (typeof value !== "string") {
    return false
  }

  return FILE_PATH_PATTERNS.some((pattern) => pattern.test(value))
}

/**
 * Recursively scan payload for sensitive fields and throw if found.
 * This aligns with the gateway's server-side filter.
 */
export function rejectSensitiveFields(payload: unknown, path = ""): void {
  if (typeof payload !== "object" || payload === null) {
    return
  }

  if (Array.isArray(payload)) {
    payload.forEach((item, index) => {
      rejectSensitiveFields(item, path ? `${path}[${index}]` : `[${index}]`)
    })
    return
  }

  for (const [key, value] of Object.entries(payload)) {
    const lowerKey = key.toLowerCase()
    const fullPath = path ? `${path}.${key}` : key

    // Check for sensitive keywords in key names
    if (SENSITIVE_KEYWORDS.some((kw) => lowerKey.includes(kw))) {
      throw new SensitiveFieldError(fullPath, `Sensitive key name: ${fullPath}`)
    }

    // Check for file paths in values
    if (isFilePath(value)) {
      throw new SensitiveFieldError(fullPath, `File path detected: ${fullPath}`)
    }

    // Recurse into nested objects and arrays
    if (typeof value === "object" && value !== null) {
      rejectSensitiveFields(value, fullPath)
    }
  }
}

/**
 * Check if a record is safe to sync (no sensitive fields).
 * Returns true if safe, false if sensitive data detected.
 */
export function isSafeToSync(payload: unknown): boolean {
  try {
    rejectSensitiveFields(payload)
    return true
  } catch (err) {
    if (err instanceof SensitiveFieldError) {
      return false
    }
    throw err
  }
}
