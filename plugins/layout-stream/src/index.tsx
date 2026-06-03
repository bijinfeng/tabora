import { For, Show } from "solid-js"
import type { LayoutViewProps } from "@tabora/plugin-api"
import type { BuiltinPlugin } from "@tabora/platform-kernel"

export function StreamLayout(props: LayoutViewProps) {
  return (
    <main class="layout-stream" data-layout="stream">
      <header class="stream-toolbar">
        <span class="stream-toolbar-logo">
          Tabora <span>Stream</span>
        </span>
        <div class="stream-toolbar-spacer" />
        <For each={props.host.getGlobalActions("toolbar")}>
          {(action) => (
            <button class="stream-toolbar-btn" type="button" onClick={() => action.run()}>
              <span aria-hidden="true">{action.icon}</span> {action.label}
            </button>
          )}
        </For>
      </header>
      <section class="stream-region">
        <div class="stream-hero">
          <div class="stream-hero-greeting">下午好 ☀</div>
        </div>
        <Show when={props.regions["stream"]}>{props.regions["stream"]!.render()}</Show>
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
    entry: "./index",
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
