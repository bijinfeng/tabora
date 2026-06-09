import { For, Show } from "solid-js"
import type { JSX } from "solid-js"
import type { LayoutViewProps } from "@tabora/plugin-api"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { AlignJustify } from "lucide-solid"
import { HostActionIcon } from "./host-action-icon"

export function StreamLayout(props: LayoutViewProps<JSX.Element>) {
  const toolbarActions = () => props.host.getGlobalActions("toolbar")

  return (
    <main class="layout-stream" data-layout="stream">
      <header class="stream-toolbar">
        <div class="stream-toolbar-actions">
          <div class="layout-switch" aria-label="布局切换">
            <For each={toolbarActions().filter((action) => action.id === "layout-switch")}>
              {(action) => (
                <button
                  class="tb-btn"
                  type="button"
                  aria-label={action.label}
                  title={action.label}
                  onClick={() => action.run()}
                >
                  <AlignJustify size={15} />
                </button>
              )}
            </For>
          </div>
          <For each={toolbarActions().filter((action) => action.id !== "layout-switch")}>
            {(action) => (
              <button
                class="stream-toolbar-btn"
                type="button"
                aria-label={action.label}
                title={action.shortcut ? `${action.label} ${action.shortcut}` : action.label}
                onClick={() => action.run()}
              >
                <HostActionIcon id={action.id} icon={action.icon} size={16} />
              </button>
            )}
          </For>
        </div>
        {/* Preserve the extension surface for future toolbar-only actions. */}
        <For each={props.host.getGlobalActions("menu")}>
          {(action) => (
            <button class="stream-toolbar-btn" type="button" onClick={() => action.run()}>
              <HostActionIcon id={action.id} icon={action.icon} size={16} />
            </button>
          )}
        </For>
      </header>
      <section class="stream-region">
        <div class="stream-hero">
          <div class="stream-hero-greeting">下午好</div>
          <div class="stream-hero-date">按下 ⌘K 搜索、切换卡片或打开命令。</div>
        </div>
        <div class="workbench-grid">
          <Show when={props.regions["stream"]}>{props.regions["stream"]!.render()}</Show>
        </div>
      </section>
    </main>
  )
}

export const layoutStream: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.layout.workbench-stream",
    name: "Workbench Stream Layout",
    version: "1.0.0",
    apiVersion: "1.0.0",
    entry: "./index",
    styles: [{ href: "./styles.css", scope: "global", order: 20 }],
    engine: { platform: "^0.1.0" },
    contributes: {
      layouts: [
        {
          id: "official.layout.workbench-stream",
          title: "工作台流式布局",
          view: "official.layout.workbench-stream.view",
          regions: [{ id: "stream", title: "卡片流", accepts: ["widget"], required: true }],
          defaultRegions: {
            stream: [
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
    context.registry.views.register("official.layout.workbench-stream.view", StreamLayout)
  },
}
