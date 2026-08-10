import type { PluginManifest } from "@tabora/plugin-api/sdk"

export const layoutMobileManifest: PluginManifest = {
  id: "official.layout.workbench-mobile",
  name: "Workbench Mobile Layout",
  version: "1.0.0",
  apiVersion: "1.0.0",
  entry: "./index",
  styles: [{ href: "./styles.css", scope: "global", order: 20 }],
  engine: { platform: "^0.1.0" },
  contributes: {
    layouts: [
      {
        id: "official.layout.workbench-mobile",
        title: "工作台移动布局",
        view: "official.layout.workbench-mobile.view",
        regions: [
          {
            id: "topbar",
            title: "顶部搜索区",
            accepts: ["search"],
            required: false,
            maxInstances: 1,
          },
          { id: "mainGrid", title: "主网格", accepts: ["widget"], required: true },
          { id: "focus", title: "专注卡片", accepts: ["widget"], required: false },
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
        supportsResponsive: false,
      },
    ],
  },
}
