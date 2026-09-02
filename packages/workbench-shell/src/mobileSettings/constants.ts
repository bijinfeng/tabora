import type { SettingsSectionId } from "@tabora/plugin-api"

export const MOBILE_SETTINGS_GROUPS = [
  {
    id: "workspace" as const,
    title: "工作台",
    sections: ["general", "appearance", "search"] as SettingsSectionId[],
  },
  {
    id: "services" as const,
    title: "扩展",
    sections: ["ai", "sync", "plugins", "about"] as SettingsSectionId[],
  },
] as const

export const INDEX_SECTION_META_FALLBACK: Record<SettingsSectionId, string> = {
  general: "本地保存",
  appearance: "即时生效",
  search: "快捷入口",
  account: "未登录",
  ai: "首次授权",
  sync: "V1",
  plugins: "插件状态",
  about: "V2",
}
