import type { BuiltinPlugin } from "@tabora/platform-kernel"

export function TopSearchGridLayout(props: { topbar: any; mainGrid: any }) {
  return (
    <main class="workbench-shell">
      <section class="topbar-region">{props.topbar}</section>
      <section class="main-grid-region">{props.mainGrid}</section>
    </main>
  )
}

export const officialLayoutTopSearchGrid: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.layout.top-search-grid",
    name: "Top Search Grid Layout",
    version: "0.0.0",
    apiVersion: "1.0.0",
    entry: "./layout-top-search-grid",
    engine: { platform: "^0.1.0" },
    contributes: {
      layouts: [
        {
          id: "official.layout.top-search-grid",
          title: "顶部搜索 + 网格工作台",
          regions: [
            {
              id: "topbar",
              title: "顶部搜索区",
              accepts: ["search"],
              required: true,
              maxInstances: 1,
            },
            { id: "mainGrid", title: "主网格", accepts: ["widget"], required: true },
          ],
          defaultRegions: {
            topbar: [{ instanceId: "search-main" }],
            mainGrid: [{ instanceId: "quick-links-1" }, { instanceId: "notes-1" }],
          },
          supportsResponsive: true,
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register("official.layout.top-search-grid.view", TopSearchGridLayout)
  },
}
