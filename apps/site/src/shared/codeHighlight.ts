import { createHighlighter } from "@tanstack/highlight/core"
import { html } from "@tanstack/highlight/languages/html"
import { json } from "@tanstack/highlight/languages/json"
import { plaintext } from "@tanstack/highlight/languages/plaintext"
import { shell } from "@tanstack/highlight/languages/shell"
import { tsx } from "@tanstack/highlight/languages/tsx"

type HighlightLang = "json" | "tsx" | "html" | "shell" | "plaintext"

const highlighter = createHighlighter({
  languages: [json, tsx, html, shell, plaintext],
})

const guessLanguage = (value: string): HighlightLang => {
  const trimmed = value.trim()
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) return "json"
  if (/(^|\n)\s*(pnpm|npm|yarn|bun)\s+/.test(value) || /(^|\n)\s*#/.test(value)) return "shell"
  if (/(^|\n)\s*(import|export|type|interface|const|let|var|function)\b/.test(value)) {
    return "tsx"
  }
  if (trimmed.includes("<") && trimmed.includes(">")) return "html"
  return "plaintext"
}

const unwrapInner = (wrappedHtml: string) => {
  const openEnd = wrappedHtml.indexOf(">", wrappedHtml.indexOf("<code"))
  const closeStart = wrappedHtml.lastIndexOf("</code>")
  if (openEnd === -1 || closeStart === -1 || closeStart <= openEnd) return wrappedHtml
  return wrappedHtml.slice(openEnd + 1, closeStart)
}

export const highlightCode = (value: string, lang?: HighlightLang) => {
  const resolvedLang = lang ?? guessLanguage(value)
  const result = highlighter.highlight(value, { lang: resolvedLang })
  return unwrapInner(result.html)
}

export type { HighlightLang }
