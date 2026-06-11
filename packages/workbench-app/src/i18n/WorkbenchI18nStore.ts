import { createSignal } from "solid-js"

export type WorkbenchLocale = "zh-CN" | "en-US"

export type I18nMessageBundle = {
  locale: WorkbenchLocale
  messages: Record<string, string>
}

export type CreateWorkbenchI18nStoreOptions = {
  initialLocale: WorkbenchLocale
  fallbackLocale: WorkbenchLocale
}

function normalizeLocale(locale: string): WorkbenchLocale {
  const lower = locale.toLowerCase()
  if (lower.startsWith("en")) return "en-US"
  return "zh-CN"
}

function resolveGlobalDefaultLocale(): WorkbenchLocale {
  const language = globalThis.navigator?.language
  if (typeof language !== "string" || language.length === 0) return "zh-CN"
  return normalizeLocale(language)
}

function localeFallbackChain(
  locale: WorkbenchLocale,
  fallback: WorkbenchLocale,
): WorkbenchLocale[] {
  if (locale === fallback) return [locale]
  return [locale, fallback]
}

function applyTemplate(message: string, vars: Record<string, string | number> | undefined): string {
  if (!vars) return message
  let result = message
  for (const [key, value] of Object.entries(vars)) {
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g")
    result = result.replace(pattern, String(value))
  }
  return result
}

export function createWorkbenchI18nStore(options?: Partial<CreateWorkbenchI18nStoreOptions>) {
  const fallbackLocale = options?.fallbackLocale ?? "zh-CN"
  const [locale, setLocale] = createSignal<WorkbenchLocale>(
    options?.initialLocale ?? resolveGlobalDefaultLocale(),
  )
  const pluginMessages = new Map<string, Map<WorkbenchLocale, Record<string, string>>>()

  function registerMessages(pluginId: string, bundles: I18nMessageBundle[]) {
    const byLocale = pluginMessages.get(pluginId) ?? new Map()
    for (const bundle of bundles) {
      const current = byLocale.get(bundle.locale) ?? {}
      byLocale.set(bundle.locale, { ...current, ...bundle.messages })
    }
    pluginMessages.set(pluginId, byLocale)
  }

  function resolveMessage(
    pluginId: string,
    key: string,
    targetLocale: WorkbenchLocale,
  ): string | undefined {
    const byLocale = pluginMessages.get(pluginId)
    const messages = byLocale?.get(targetLocale)
    if (!messages) return undefined
    const fullKey = key.startsWith(`${pluginId}.`) ? key : `${pluginId}.${key}`
    return messages[fullKey] ?? messages[key]
  }

  function t(pluginId: string, key: string, vars?: Record<string, string | number>): string {
    const currentLocale = locale()
    for (const candidateLocale of localeFallbackChain(currentLocale, fallbackLocale)) {
      const message = resolveMessage(pluginId, key, candidateLocale)
      if (typeof message === "string") return applyTemplate(message, vars)
    }
    return `${pluginId}.${key}`
  }

  function formatDate(date: Date, formatOptions?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat(locale(), formatOptions).format(date)
  }

  function formatNumber(value: number, formatOptions?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(locale(), formatOptions).format(value)
  }

  return {
    locale,
    setLocale,
    registerMessages,
    t,
    formatDate,
    formatNumber,
    defaultLocale: resolveGlobalDefaultLocale,
  }
}

export type WorkbenchI18nStore = ReturnType<typeof createWorkbenchI18nStore>
