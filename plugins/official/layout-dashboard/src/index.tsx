import type { JSX } from "solid-js"
import type { LayoutViewProps } from "@tabora/plugin-api"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { DashboardLayout } from "./dashboard-layout"
import { FocusLayout } from "./focus-layout"
import { layoutDashboardManifest } from "./manifest"

export { DashboardLayout, FocusLayout }

export const layoutDashboard: BuiltinPlugin = {
  enabled: true,
  manifest: layoutDashboardManifest,
  activate(context) {
    context.i18n?.registerMessages([
      {
        locale: "zh-CN",
        messages: {
          "greeting.morning": "早上好",
          "greeting.afternoon": "下午好",
          "greeting.evening": "晚上好",
          "actions.addWidget": "添加卡片",
          "search.placeholder": "搜索或命令",
          "focus.empty": "添加第一张卡片",
          "focus.switchHero": "切换到主卡片",
        },
      },
      {
        locale: "en-US",
        messages: {
          "greeting.morning": "Good morning",
          "greeting.afternoon": "Good afternoon",
          "greeting.evening": "Good evening",
          "actions.addWidget": "Add widget",
          "search.placeholder": "Search or command",
          "focus.empty": "Add your first widget",
          "focus.switchHero": "Switch to main",
        },
      },
    ])

    context.registry.views.register(
      "official.layout.workbench-dashboard.view",
      (props: LayoutViewProps<JSX.Element>) =>
        DashboardLayout({ ...props, ...(context.i18n ? { i18n: context.i18n } : {}) }),
    )
    context.registry.views.register(
      "official.layout.workbench-focus.view",
      (props: LayoutViewProps<JSX.Element>) =>
        FocusLayout({ ...props, ...(context.i18n ? { i18n: context.i18n } : {}) }),
    )
  },
}
