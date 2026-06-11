import type { LayoutHostAPI } from "@tabora/plugin-api"

import {
  resolveWorkbenchLayoutToggleTarget,
  resolveWorkbenchThemeToggleTarget,
  type WorkbenchShellConfig,
} from "../shared/shellConfig"
import type { ShellTranslation } from "../i18n"

export function createWorkbenchLayoutHostAPI(options: {
  activeLayoutId: () => string
  isDark: () => boolean
  tShell?: ShellTranslation
  shellConfig: WorkbenchShellConfig
  setCommandPaletteOpen: (open: boolean) => void
  setAddWidgetOpen: (open: boolean) => void
  openSettings: (panelId?: string) => void
  readLayoutState: LayoutHostAPI["readLayoutState"]
  writeLayoutState: LayoutHostAPI["writeLayoutState"]
  showToast: LayoutHostAPI["showToast"]
  switchLayout: (layoutId: string) => void
  switchTheme: (themeId: string) => void
  runRailAction: (actionId: string) => void
}): LayoutHostAPI {
  const t = options.tShell
  return {
    getGlobalActions: (surface) => {
      const layoutToggle = {
        id: "layout-switch" as const,
        label:
          options.activeLayoutId() === options.shellConfig.layoutIds.dashboard
            ? (t?.("layoutHost.layoutToggle.toFocus") ?? "切换到专注")
            : (t?.("layoutHost.layoutToggle.toDashboard") ?? "切换到仪表盘"),
        icon:
          options.activeLayoutId() === options.shellConfig.layoutIds.dashboard
            ? "layout-focus"
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
            label: t?.("layoutHost.rail.home") ?? "分组 我的工作台",
            icon: "⌂",
            isActive: true,
            run: () => options.runRailAction("home"),
          },
          {
            id: "add-widget",
            label: t?.("layoutHost.rail.addWidget") ?? "添加卡片",
            icon: "+",
            run: () => options.runRailAction("add-widget"),
          },
          layoutToggle,
          {
            id: "theme",
            label: t?.("layoutHost.rail.toggleTheme") ?? "切换主题",
            icon: "☼",
            run: () => options.runRailAction("theme"),
          },
          {
            id: "settings",
            label: t?.("layoutHost.common.settings") ?? "设置",
            icon: "⚙",
            run: () => options.runRailAction("settings"),
          },
        ]
      }

      if (surface === "toolbar") {
        return [
          {
            id: "command",
            label: t?.("layoutHost.common.command") ?? "命令",
            icon: "⌘K",
            shortcut: "⌘K",
            run: () => options.setCommandPaletteOpen(true),
          },
          layoutToggle,
          {
            id: "theme",
            label: options.isDark()
              ? (t?.("layoutHost.themeTarget.light") ?? "明亮")
              : (t?.("layoutHost.themeTarget.dark") ?? "暗色"),
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
            label: t?.("layoutHost.common.settings") ?? "设置",
            icon: "⚙",
            run: () => options.runRailAction("settings"),
          },
        ]
      }

      if (surface === "menu") {
        return [
          {
            id: "command",
            label: t?.("layoutHost.common.command") ?? "命令",
            icon: "⌘K",
            shortcut: "⌘K",
            run: () => options.setCommandPaletteOpen(true),
          },
          {
            id: "add-widget",
            label: t?.("layoutHost.rail.addWidget") ?? "添加卡片",
            icon: "+",
            run: () => options.setAddWidgetOpen(true),
          },
          layoutToggle,
          {
            id: "theme",
            label: options.isDark()
              ? (t?.("layoutHost.themeTarget.light") ?? "明亮")
              : (t?.("layoutHost.themeTarget.dark") ?? "暗色"),
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
            label: t?.("layoutHost.common.settings") ?? "设置",
            icon: "⚙",
            run: () => options.openSettings(options.shellConfig.settingsPanelIds.appearance),
          },
        ]
      }

      return []
    },
    openSettings: (panelId?: string) => options.openSettings(panelId),
    openCommandPalette: () => options.setCommandPaletteOpen(true),
    openAddWidget: () => options.setAddWidgetOpen(true),
    readLayoutState: options.readLayoutState,
    writeLayoutState: options.writeLayoutState,
    showToast: options.showToast,
    toggleTheme: () => {
      options.switchTheme(
        resolveWorkbenchThemeToggleTarget(options.isDark(), options.shellConfig.themeIds),
      )
    },
    isDark: () => options.isDark(),
  }
}
