export type QuickLink = {
  id: string
  title: string
  url: string
  groupId?: string
  color?: string
}

export type QuickGroup = {
  id: string
  name: string
  visible: boolean
}

export const LINKS_KEY = "quick-links"
export const GROUPS_KEY = "quick-links-groups"
export const RECENT_KEY = "quick-links-recent"

export const MAX_LINKS = 12

/** 入口图标可选色，第一项为品牌强调色，与设计稿 color-strip 一致。 */
export const ICON_COLORS = ["#1a9070", "#3b82f6", "#8b5cf6", "#d97706"] as const

export const DEFAULT_GROUPS: QuickGroup[] = [
  { id: "work", name: "工作", visible: true },
  { id: "design", name: "设计", visible: true },
  { id: "personal", name: "个人", visible: true },
]

function uid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `ql_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function makeId(): string {
  return uid()
}

export function getDefaultLinks(config: Record<string, unknown>): QuickLink[] {
  if (Array.isArray(config.links) && config.links.length > 0) {
    return (config.links as Array<{ title: string; url: string; groupId?: string }>).map((link) => {
      const next: QuickLink = { id: uid(), title: link.title, url: link.url }
      if (link.groupId) next.groupId = link.groupId
      return next
    })
  }
  return [
    { id: uid(), title: "GitHub", url: "https://github.com", groupId: "work" },
    { id: uid(), title: "Notion", url: "https://notion.so", groupId: "work" },
    { id: uid(), title: "Linear", url: "https://linear.app", groupId: "work" },
    { id: uid(), title: "Figma", url: "https://figma.com", groupId: "design" },
    { id: uid(), title: "YouTube", url: "https://youtube.com", groupId: "personal" },
  ]
}

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === "http:" || parsed.protocol === "https:"
  } catch {
    return false
  }
}

/** 去掉协议和末尾斜杠，仅用于展示主机名，如 github.com。 */
export function displayUrl(url: string): string {
  return url
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "")
}

/** 取标题前两位生成图标字样，英文返回首两位大写，中文取首字，与设计稿一致。 */
export function initialsFromTitle(title: string): string {
  const normalized = title.trim()
  if (!normalized) return "Ln"
  if (/^[a-z0-9]/i.test(normalized)) return normalized.slice(0, 2).toUpperCase()
  return normalized.slice(0, 1)
}
