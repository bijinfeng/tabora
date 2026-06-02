import type { JSX } from "solid-js"
import type { BuiltinPlugin } from "@tabora/platform-kernel"

export type WorkbenchStreamLayoutProps = {
  toolbar: JSX.Element
  stream: JSX.Element
}

export function WorkbenchStreamLayout(props: WorkbenchStreamLayoutProps) {
  return (
    <main class="workbench-shell" data-layout="workbench-stream">
      <header class="workbench-stream-toolbar">{props.toolbar}</header>
      <section class="workbench-stream-region">{props.stream}</section>
    </main>
  )
}

export const officialLayoutWorkbenchStream: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.layout.workbench-stream",
    name: "Workbench Stream Layout",
    version: "0.0.0",
    entry: "./layout-workbench-stream",
    engine: { platform: "^0.1.0" },
    contributes: {
      layouts: [
        {
          id: "official.layout.workbench-stream",
          title: "工作台流式布局",
          view: "official.layout.workbench-stream.view",
          regions: [
            {
              id: "stream",
              title: "卡片流",
              accepts: ["widget"],
              required: true,
            },
          ],
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
    context.registry.views.register("official.layout.workbench-stream.view", WorkbenchStreamLayout)
  },
}
