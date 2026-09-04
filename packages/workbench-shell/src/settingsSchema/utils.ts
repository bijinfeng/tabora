import type { SettingsNode, SettingsStatusTone } from "@tabora/plugin-api"
import type { BadgeVariant } from "@tabora/ui/badge"
import { styles } from "./styles"

export function messageFor(error: unknown): string {
  return error instanceof Error ? error.message : "设置内容加载失败"
}

export function initialValues(nodes: SettingsNode[]): Record<string, unknown> {
  const values: Record<string, unknown> = {}
  const visit = (node: SettingsNode) => {
    if (node.type === "stack" || node.type === "group") {
      node.children.forEach(visit)
      return
    }
    if (node.type === "field") {
      if (node.control === "password") values[node.id] = ""
      else values[node.id] = node.value ?? (node.control === "switch" ? false : "")
    }
  }
  nodes.forEach(visit)
  return values
}

export function statusValueStyle(tone: SettingsStatusTone | undefined) {
  if (tone === "success") return styles.statusSuccess
  if (tone === "warning") return styles.statusWarning
  if (tone === "danger") return styles.statusDanger
  if (tone === "accent") return styles.statusAccent
  return null
}

export function statusBadgeVariant(tone: SettingsStatusTone | undefined): BadgeVariant {
  if (tone === "success") return "success"
  if (tone === "warning") return "warning"
  if (tone === "danger") return "danger"
  return "neutral"
}

export function rowMetaStyle(tone: SettingsStatusTone | undefined) {
  if (tone === "success") return styles.statusSuccess
  if (tone === "warning") return styles.statusWarning
  if (tone === "danger") return styles.statusDanger
  if (tone === "accent") return styles.statusAccent
  return null
}
