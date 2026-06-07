import type { LayoutHostAPI } from "@tabora/plugin-api"

const DASHBOARD_LAYOUT_ID = "official.layout.workbench-dashboard"
const STREAM_LAYOUT_ID = "official.layout.workbench-stream"

function nextLayoutId(activeLayoutId: string): string {
  return activeLayoutId === DASHBOARD_LAYOUT_ID ? STREAM_LAYOUT_ID : DASHBOARD_LAYOUT_ID
}

export function createWorkbenchLayoutHostAPI(options: {
  activeLayoutId: () => string
  isDark: () => boolean
  setCommandPaletteOpen: (open: boolean) => void
  setAddWidgetOpen: (open: boolean) => void
  openSettings: (panelId?: string) => void
  switchLayout: (layoutId: string) => void
  switchTheme: (themeId: string) => void
  runRailAction: (actionId: string) => void
}): LayoutHostAPI {
  return {
    getGlobalActions: (surface) => {
      const layoutToggle = {
        id: "layout-switch" as const,
        label: options.activeLayoutId() === DASHBOARD_LAYOUT_ID ? "切换到流式" : "切换到仪表盘",
        icon:
          options.activeLayoutId() === DASHBOARD_LAYOUT_ID ? "layout-stream" : "layout-dashboard",
        shortcut: "⌘L",
        run: () => {
          options.switchLayout(nextLayoutId(options.activeLayoutId()))
        },
      }

      if (surface === "rail") {
        return [
          {
            id: "home",
            label: "主页",
            icon: "⌂",
            isActive: true,
            run: () => options.runRailAction("home"),
          },
          {
            id: "add-widget",
            label: "添加卡片",
            icon: "+",
            run: () => options.runRailAction("add-widget"),
          },
          {
            id: "theme",
            label: "切换主题",
            icon: "☼",
            run: () => options.runRailAction("theme"),
          },
          {
            id: "settings",
            label: "设置",
            icon: "⚙",
            run: () => options.runRailAction("settings"),
          },
        ]
      }

      if (surface === "toolbar") {
        return [
          {
            id: "command",
            label: "命令",
            icon: "⌘K",
            shortcut: "⌘K",
            run: () => options.setCommandPaletteOpen(true),
          },
          layoutToggle,
          {
            id: "theme",
            label: options.isDark() ? "明亮" : "暗色",
            icon: options.isDark() ? "☀" : "☾",
            shortcut: "⌘T",
            run: () => {
              options.switchTheme(options.isDark() ? "official.theme.light" : "official.theme.dark")
            },
          },
          {
            id: "settings",
            label: "设置",
            icon: "⚙",
            run: () => options.runRailAction("settings"),
          },
        ]
      }

      return []
    },
    openSettings: (panelId?: string) => options.openSettings(panelId),
    openCommandPalette: () => options.setCommandPaletteOpen(true),
    openAddWidget: () => options.setAddWidgetOpen(true),
    toggleTheme: () => {
      options.switchTheme(options.isDark() ? "official.theme.light" : "official.theme.dark")
    },
    isDark: () => options.isDark(),
  }
}
