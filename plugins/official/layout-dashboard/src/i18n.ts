export function greeting(t: (key: string) => string) {
  const h = new Date().getHours()
  return h < 12 ? t("greeting.morning") : h < 18 ? t("greeting.afternoon") : t("greeting.evening")
}

export function dateLabel(locale: string) {
  const now = new Date()
  const date = new Intl.DateTimeFormat(locale, {
    month: "numeric",
    day: "numeric",
  }).format(now)
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(now)
  return `${date} ${weekday}`
}

export function fallbackText(key: string): string {
  const messages: Record<string, string> = {
    "greeting.morning": "早上好",
    "greeting.afternoon": "下午好",
    "greeting.evening": "晚上好",
    "actions.addWidget": "+ 添加卡片",
    "search.placeholder": "搜索或命令",
    "focus.empty": "添加第一张卡片",
    "focus.switchHero": "切换到主卡片",
  }
  return messages[key] ?? key
}
