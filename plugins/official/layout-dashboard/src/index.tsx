import { TaboraMark } from "@tabora/brand"
import { For, Show } from "solid-js"
import type { LayoutViewProps } from "@tabora/plugin-api"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { AlignJustify, LayoutGrid, Plus } from "lucide-solid"
import { HostActionIcon } from "./host-action-icon"

export function DashboardLayout(props: LayoutViewProps) {
  const toolbarActions = () => props.host.getGlobalActions("toolbar")
  const addWidgetAction = () =>
    props.host.getGlobalActions("rail").find((action) => action.id === "add-widget")
  const layoutAction = () => toolbarActions().find((action) => action.id === "layout-switch")
  const greeting = () => {
    const h = new Date().getHours()
    return h < 12 ? "早上好" : h < 18 ? "下午好" : "晚上好"
  }
  const dateLabel = () => {
    const now = new Date()
    const date = new Intl.DateTimeFormat("zh-CN", {
      month: "numeric",
      day: "numeric",
    }).format(now)
    const weekday = new Intl.DateTimeFormat("zh-CN", { weekday: "long" }).format(now)
    return `${date} ${weekday}`
  }

  return (
    <main class="layout-dashboard" data-layout="dashboard">
      <aside class="dash-rail workbench-rail" aria-label="工作台导航">
        <TaboraMark class="dash-rail-logo" />
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
              <HostActionIcon id={action.id} icon={action.icon} />
            </button>
          )}
        </For>
        <div class="dash-rail-spacer" />
      </aside>
      <section class="dash-content">
        <header class="dash-topbar">
          <div class="dash-greeting">
            <div class="dash-greeting-title">
              {greeting()} <span class="dash-greeting-muted">· {dateLabel()}</span>
            </div>
            <div class="dash-greeting-actions">
              <Show when={addWidgetAction()}>
                {(action) => (
                  <button
                    class="tb-btn dash-toolbar-btn dash-add-widget-btn"
                    type="button"
                    onClick={() => action().run()}
                  >
                    <Plus size={14} />
                    <span>添加卡片</span>
                  </button>
                )}
              </Show>
              <div class="layout-switch" aria-label="布局切换">
                <button
                  class="tb-btn active"
                  type="button"
                  aria-label="切换到仪表盘布局"
                  title="仪表盘布局"
                  onClick={() => undefined}
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  class="tb-btn"
                  type="button"
                  aria-label={layoutAction()?.label ?? "切换到流式布局"}
                  title="流式布局"
                  onClick={() => layoutAction()?.run()}
                >
                  <AlignJustify size={15} />
                </button>
              </div>
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
    apiVersion: "1.0.0",
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
      ],
    },
  },
  activate(context) {
    context.registry.views.register("official.layout.workbench-dashboard.view", DashboardLayout)
  },
}
