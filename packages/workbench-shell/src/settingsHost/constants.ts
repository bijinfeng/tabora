import type { SettingsSectionId } from "@tabora/orchestrator"

export const SECTION_FALLBACK_DESCRIPTIONS: Record<SettingsSectionId, string> = {
  general: "工作区、布局和基础行为。所有设置只影响当前个人工作台。",
  appearance: "主题、背景和强调色。视觉配置来自主题插件。",
  search: "默认搜索源、搜索范围和命令入口。",
  account: "登录 Tabora 账号，用于云同步和设备注册。",
  ai: "模型提供商、默认模型、连接测试和插件 AI 授权。",
  sync: "状态、范围和处理。",
  plugins: "已安装插件、运行配置、设置表单协议和本地权限。",
  about: "版本、数据位置和插件化工作台说明。",
}

export const WORKSPACE_SECTION_IDS: SettingsSectionId[] = ["general", "appearance", "search"]
export const EXTENSION_SECTION_IDS: SettingsSectionId[] = ["ai", "sync", "plugins", "about"]
