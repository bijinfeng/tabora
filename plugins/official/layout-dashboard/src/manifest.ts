import type { PluginManifest } from "@tabora/plugin-api/sdk"

export const layoutDashboardManifest: PluginManifest = {
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
            { instanceId: "quick-links-1" },
            { instanceId: "todo-1" },
            { instanceId: "notes-1" },
            { instanceId: "weather-1" },
          ],
        },
        supportsResponsive: true,
      },
      {
        id: "official.layout.workbench-focus",
        title: "工作台专注布局",
        view: "official.layout.workbench-dashboard.focus.view",
        regions: [{ id: "focus", title: "专注卡片", accepts: ["widget"], required: true }],
        defaultRegions: {
          focus: [
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
}
