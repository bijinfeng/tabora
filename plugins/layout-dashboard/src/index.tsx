import { For, Show } from "solid-js"
import type { LayoutViewProps } from "@tabora/plugin-api"
import type { BuiltinPlugin } from "@tabora/platform-kernel"

export function DashboardLayout(props: LayoutViewProps) {
  const toolbarActions = () => props.host.getGlobalActions("toolbar")

  return (
    <main class="layout-dashboard" data-layout="dashboard">
      <aside class="dash-rail workbench-rail" aria-label="工作台导航">
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
        <div class="dash-rail-spacer" />
      </aside>
      <section class="dash-content">
        <header class="dash-topbar">
          <div class="dash-greeting">
            <div>
              <span class="dash-greeting-title">
                {(() => {
                  const h = new Date().getHours()
                  return h < 12 ? "早上好" : h < 18 ? "下午好" : "晚上好"
                })()}
              </span>
              <span class="dash-greeting-muted">，把今天整理成几个安静的模块。</span>
            </div>
            <div class="dash-greeting-actions">
              <div class="layout-switch" aria-label="布局切换">
                <For each={toolbarActions().filter((action) => action.shortcut === "⌘L")}>
                  {(action) => (
                    <button
                      class="tb-btn"
                      type="button"
                      aria-label={action.label}
                      title={action.label}
                      onClick={() => action.run()}
                    >
                      {action.icon}
                    </button>
                  )}
                </For>
              </div>
              <For each={toolbarActions().filter((action) => action.shortcut !== "⌘L")}>
                {(action) => (
                  <button
                    class="dash-toolbar-btn"
                    type="button"
                    aria-label={action.label}
                    title={action.shortcut ? `${action.label} ${action.shortcut}` : action.label}
                    onClick={() => action.run()}
                  >
                    {action.icon}
                  </button>
                )}
              </For>
            </div>
          </div>
          <div class="dash-search-stage">
            <Show when={props.regions["topbar"]}>{props.regions["topbar"]!.render()}</Show>
          </div>
        </header>
        <section class="dash-grid">
          <div class="workbench-grid">
            <Show when={props.regions["mainGrid"]}>{props.regions["mainGrid"]!.render()}</Show>
          </div>
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
