import type { JSX } from "solid-js"
import type { LayoutViewProps } from "@tabora/plugin-api"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { DashboardLayout } from "./dashboard-layout"
import { FocusLayout } from "./focus-layout"

export { DashboardLayout, FocusLayout }

export const layoutDashboard: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.layout.workbench-dashboard",
    name: "Workbench Dashboard Layout",
    version: "1.0.0",
    apiVersion: "1.0.0",
    entry: "./index",
    styles: [{ href: "./styles.css", scope: "global", order: 20 }],
    engine: { platform: "^0.1.0" },
    contributes: {
      layouts: [
        {
          id: "official.layout.workbench-dashboard",
          title: "工作台仪表盘布局",
          view: "official.layout.workbench-dashboard.view",
          regions: [
            {
              id: "topbar",
              title: "顶部搜索区",
              accepts: ["search"],
              required: false,
              maxInstances: 1,
            },
            { id: "mainGrid", title: "主网格", accepts: ["widget"], required: true },
          ],
          defaultRegions: {
            topbar: [{ instanceId: "search-main" }],
            mainGrid: [
              { instanceId: "today-focus-1" },
              { instanceId: "quick-links-1" },
              { instanceId: "todo-1" },
              { instanceId: "notes-1" },
              { instanceId: "weather-1" },
              { instanceId: "today-focus-2" },
              { instanceId: "quick-links-2" },
              { instanceId: "todo-2" },
            ],
          },
          supportsResponsive: true,
        },
        {
          id: "official.layout.workbench-focus",
          title: "工作台专注布局",
          view: "official.layout.workbench-focus.view",
          regions: [{ id: "focus", title: "专注卡片", accepts: ["widget"], required: true }],
          defaultRegions: {
            focus: [
              { instanceId: "today-focus-1" },
              { instanceId: "quick-links-1" },
              { instanceId: "todo-1" },
              { instanceId: "notes-1" },
              { instanceId: "weather-1" },
            ],
          },
          supportsResponsive: true,
        },
      ],
    },
  },
  activate(context) {
    context.i18n?.registerMessages([
      {
        locale: "zh-CN",
        messages: {
          "greeting.morning": "早上好",
          "greeting.afternoon": "下午好",
          "greeting.evening": "晚上好",
          "actions.addWidget": "+ 添加卡片",
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
          "actions.addWidget": "+ Add widget",
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
