import type { JSX } from "solid-js"
import type { LayoutViewProps, PluginModule } from "@tabora/plugin-api/sdk"
import { MobileLayoutWithRouter } from "./mobile-layout-with-router"
import { layoutMobileManifest } from "./manifest"

export { MobileLayoutWithRouter as MobileLayout }

export const layoutMobile: PluginModule = {
  manifest: layoutMobileManifest,
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
          "grid.empty": "添加第一张卡片",
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
          "grid.empty": "Add your first widget",
        },
      },
    ])

    context.views.register(
      "official.layout.workbench-mobile.view",
      (props: LayoutViewProps<JSX.Element>) =>
        MobileLayoutWithRouter({ ...props, ...(context.i18n ? { i18n: context.i18n } : {}) }),
    )
  },
}
