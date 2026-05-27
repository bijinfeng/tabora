import type { JSX } from "solid-js"
import type { BuiltinPlugin } from "@tabora/platform-kernel"

export type WorkbenchDashboardLayoutProps = {
  rail: JSX.Element
  topbar: JSX.Element
  mainGrid: JSX.Element
}

export function WorkbenchDashboardLayout(props: WorkbenchDashboardLayoutProps) {
  return (
    <main class="workbench-shell" data-layout="workbench-dashboard">
      <aside class="workbench-rail-region">{props.rail}</aside>
      <section class="workbench-content-region">
        <header class="workbench-topbar-region">{props.topbar}</header>
        <section class="workbench-main-grid-region">{props.mainGrid}</section>
      </section>
    </main>
  )
}

export const officialLayoutWorkbenchDashboard: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.layout.workbench-dashboard",
    name: "Workbench Dashboard Layout",
    version: "0.0.0",
    entry: "./layout-workbench-dashboard",
    engine: { platform: "^0.1.0" },
    contributes: {
      layouts: [
        {
          id: "official.layout.workbench-dashboard",
          title: "工作台仪表盘布局",
          view: "official.layout.workbench-dashboard.view",
          regions: [
            {
              id: "rail",
              title: "工作台导航",
              accepts: ["layout"],
              required: true,
              maxInstances: 1,
            },
            {
              id: "topbar",
              title: "顶部搜索区",
              accepts: ["search"],
              required: true,
              maxInstances: 1,
            },
            {
              id: "mainGrid",
              title: "主网格",
              accepts: ["widget"],
              required: true,
            },
          ],
          defaultRegions: {
            rail: [],
            topbar: [{ instanceId: "search-main" }],
            mainGrid: [
              { instanceId: "today-focus-1" },
              { instanceId: "quick-links-1" },
              { instanceId: "notes-1" },
              { instanceId: "todo-1" },
            ],
          },
          supportsResponsive: true,
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register(
      "official.layout.workbench-dashboard.view",
      WorkbenchDashboardLayout,
    )
  },
}
