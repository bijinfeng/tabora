import { For, Show } from "solid-js"
import type { LayoutViewProps } from "@tabora/plugin-api"
import type { BuiltinPlugin } from "@tabora/platform-kernel"

export function DashboardLayout(props: LayoutViewProps) {
  return (
    <main class="layout-dashboard" data-layout="dashboard">
      <aside class="dash-rail" aria-label="工作台导航">
        <div class="dash-rail-logo">T</div>
        <For each={props.host.getGlobalActions("rail")}>
          {(action) => (
            <button
              class="dash-rail-btn"
              classList={{ active: action.isActive }}
              aria-label={action.label}
              title={action.label}
              type="button"
              onClick={() => action.run()}
            >
              {action.icon}
            </button>
          )}
        </For>
      </aside>
      <section class="dash-content">
        <header class="dash-topbar">
          <div class="dash-greeting">
            <span>
              {(() => {
                const h = new Date().getHours()
                return h < 12 ? "早上好" : h < 18 ? "下午好" : "晚上好"
              })()}
            </span>
          </div>
          <Show when={props.regions["topbar"]}>{props.regions["topbar"]!.render()}</Show>
        </header>
        <section class="dash-grid">
          <Show when={props.regions["mainGrid"]}>{props.regions["mainGrid"]!.render()}</Show>
        </section>
      </section>
    </main>
  )
}

export const layoutDashboard: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.layout.workbench-dashboard",
    name: "Workbench Dashboard Layout",
    version: "1.0.0",
    entry: "./index",
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
    context.registry.views.register("official.layout.workbench-dashboard.view", DashboardLayout)
  },
}
