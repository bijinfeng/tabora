import type { LayoutHostAPI } from "@tabora/plugin-api"

import {
  resolveWorkbenchLayoutToggleTarget,
  resolveWorkbenchThemeToggleTarget,
  type WorkbenchShellConfig,
} from "./shellConfig"

export function createWorkbenchLayoutHostAPI(options: {
  activeLayoutId: () => string
  isDark: () => boolean
  shellConfig: WorkbenchShellConfig
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
        label:
          options.activeLayoutId() === options.shellConfig.layoutIds.dashboard
            ? "切换到流式"
            : "切换到仪表盘",
        icon:
          options.activeLayoutId() === options.shellConfig.layoutIds.dashboard
            ? "layout-stream"
            : "layout-dashboard",
        shortcut: "⌘L",
        run: () => {
          options.switchLayout(
            resolveWorkbenchLayoutToggleTarget(
              options.activeLayoutId(),
              options.shellConfig.layoutIds,
            ),
          )
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
              options.switchTheme(
                resolveWorkbenchThemeToggleTarget(options.isDark(), options.shellConfig.themeIds),
              )
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
      options.switchTheme(
        resolveWorkbenchThemeToggleTarget(options.isDark(), options.shellConfig.themeIds),
      )
    },
    isDark: () => options.isDark(),
  }
}
